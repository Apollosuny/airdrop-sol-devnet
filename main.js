// autoAirdrop.js

require('dotenv').config();
const { Connection, Keypair, LAMPORTS_PER_SOL } = require('@solana/web3.js');

// Load keypair from environment variable (an array of numbers)
const secretKey = JSON.parse(process.env.SOLANA_KEYPAIR || '[]');
if (!secretKey.length) {
  console.error('SOLANA_KEYPAIR is not defined or invalid.');
  process.exit(1);
}
const wallet = Keypair.fromSecretKey(Uint8Array.from(secretKey));

// Connection URL from env or default to Solana Devnet
const SOLANA_URL = process.env.SOLANA_URL || 'https://api.devnet.solana.com';
const connection = new Connection(SOLANA_URL, 'confirmed');

async function requestAirdrop() {
  try {
    console.log(
      `${new Date().toISOString()} - Requesting airdrop to ${wallet.publicKey.toBase58()}`
    );
    const signature = await connection.requestAirdrop(
      wallet.publicKey,
      5 * LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(signature);
    const balance = await connection.getBalance(wallet.publicKey);
    console.log(
      `${new Date().toISOString()} - New balance: ${
        balance / LAMPORTS_PER_SOL
      } SOL`
    );
  } catch (error) {
    console.error(`${new Date().toISOString()} - Airdrop failed:`, error);
    process.exit(1);
  }
}

// Execute when script is run
requestAirdrop()
  .then(() => {
    console.log(
      `Script completed. This script is scheduled via GitHub Actions workflow.`
    );
  })
  .catch((err) => {
    console.error('Error executing script:', err);
    process.exit(1);
  });
