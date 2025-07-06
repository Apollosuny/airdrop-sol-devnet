// autoAirdrop.js

require('dotenv').config();
const { Connection, Keypair, LAMPORTS_PER_SOL } = require('@solana/web3.js');

class SolanaAirdropManager {
  constructor() {
    this.connection = null;
    this.wallet = null;
    this.airdropAmount = 5 * LAMPORTS_PER_SOL;
    this.requestsPerExecution = 1;
    this.initializeWallet();
    this.initializeConnection();
  }

  initializeWallet() {
    const secretKey = JSON.parse(process.env.SOLANA_KEYPAIR || '[]');
    if (!secretKey.length) {
      console.error('SOLANA_KEYPAIR is not defined or invalid.');
      process.exit(1);
    }
    this.wallet = Keypair.fromSecretKey(Uint8Array.from(secretKey));
  }

  initializeConnection() {
    const SOLANA_URL =
      process.env.SOLANA_URL || 'https://api.devnet.solana.com';
    this.connection = new Connection(SOLANA_URL, 'confirmed');
  }

  async getBalance() {
    return await this.connection.getBalance(this.wallet.publicKey);
  }

  async requestSingleAirdrop() {
    try {
      console.log(
        `${new Date().toISOString()} - Requesting airdrop to ${this.wallet.publicKey.toBase58()}`
      );

      const signature = await this.connection.requestAirdrop(
        this.wallet.publicKey,
        this.airdropAmount
      );

      await this.connection.confirmTransaction(signature);

      const balance = await this.getBalance();
      console.log(
        `${new Date().toISOString()} - Airdrop successful! New balance: ${
          balance / LAMPORTS_PER_SOL
        } SOL`
      );

      return { success: true, signature, balance };
    } catch (error) {
      // Handle 429 error (Too Many Requests)
      const is429 =
        (error && error.code === -32003) ||
        (error && error.message && error.message.includes('429')) ||
        (error && error.message && error.message.includes('Too Many Requests'));
      if (is429) {
        console.error(
          `${new Date().toISOString()} - Airdrop stopped: Too Many Requests (429).`
        );
        return { success: false, error, is429: true };
      }
      console.error(`${new Date().toISOString()} - Airdrop failed:`, error);
      return { success: false, error };
    }
  }

  async requestMultipleAirdrops() {
    console.log(
      `\n${new Date().toISOString()} - Starting ${
        this.requestsPerExecution
      } airdrop requests...`
    );

    const initialBalance = await this.getBalance();
    console.log(`Initial balance: ${initialBalance / LAMPORTS_PER_SOL} SOL`);

    const results = [];
    let stoppedBy429 = false;

    for (let i = 0; i < this.requestsPerExecution; i++) {
      console.log(
        `\n--- Airdrop Request ${i + 1}/${this.requestsPerExecution} ---`
      );

      const result = await this.requestSingleAirdrop();
      results.push(result);

      if (result.is429) {
        console.error(
          `Stopping due to 429 Too Many Requests at request ${i + 1}`
        );
        stoppedBy429 = true;
        break;
      }

      if (!result.success) {
        console.error(`Stopping due to failed airdrop request ${i + 1}`);
        break;
      }

      if (i < this.requestsPerExecution - 1) {
        console.log('Waiting 1 second before next request...');
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    const finalBalance = await this.getBalance();
    const totalReceived = (finalBalance - initialBalance) / LAMPORTS_PER_SOL;

    console.log(`\n${new Date().toISOString()} - Airdrop session completed!`);
    console.log(`Total SOL received: ${totalReceived} SOL`);
    console.log(`Final balance: ${finalBalance / LAMPORTS_PER_SOL} SOL`);

    return {
      success: results.every((r) => r.success || r.is429),
      results,
      totalReceived,
      finalBalance: finalBalance / LAMPORTS_PER_SOL,
      stoppedBy429,
    };
  }

  async execute() {
    try {
      const result = await this.requestMultipleAirdrops();

      if (result.success) {
        if (result.stoppedBy429) {
          console.log(
            `\nScript stopped early due to 429 Too Many Requests. Exiting gracefully.`
          );
          process.exit(0);
        } else {
          console.log(
            `\nScript completed successfully. This script is scheduled via GitHub Actions workflow.`
          );
        }
      } else {
        console.error('\nScript completed with errors.');
        process.exit(1);
      }

      return result;
    } catch (error) {
      console.error('Error executing airdrop manager:', error);
      process.exit(1);
    }
  }
}

// Execute when script is run
const airdropManager = new SolanaAirdropManager();
airdropManager
  .execute()
  .then((result) => {
    console.log('Airdrop manager execution finished.');
  })
  .catch((err) => {
    console.error('Error executing script:', err);
    process.exit(1);
  });
