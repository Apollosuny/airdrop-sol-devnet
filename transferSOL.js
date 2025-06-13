// transferSOL.js - Transfer SOL from your wallet to another address

require('dotenv').config();
const {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  SystemProgram,
} = require('@solana/web3.js');

// Get recipient address from command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node transferSOL.js <RECIPIENT_ADDRESS> <AMOUNT_SOL>');
  console.error(
    'Example: node transferSOL.js 7UX2i7SucgLMQcfZ75s3VXmZZY4YRUyJN9X1RgfMoDUi 1.5'
  );
  process.exit(1);
}

const recipientAddress = args[0];
const amountToSend = parseFloat(args[1]);

if (isNaN(amountToSend) || amountToSend <= 0) {
  console.error('Error: Amount must be a positive number');
  process.exit(1);
}

// Load sender keypair from environment variable
const secretKey = JSON.parse(process.env.SOLANA_KEYPAIR || '[]');
if (!secretKey.length) {
  console.error('SOLANA_KEYPAIR is not defined or invalid in .env file');
  process.exit(1);
}
const senderWallet = Keypair.fromSecretKey(Uint8Array.from(secretKey));

// Connection URL from env or default to Solana Devnet
const SOLANA_URL = process.env.SOLANA_URL || 'https://api.devnet.solana.com';
const connection = new Connection(SOLANA_URL, 'confirmed');

async function transferSOL() {
  try {
    // Validate recipient address
    let recipientPublicKey;
    try {
      recipientPublicKey = new PublicKey(recipientAddress);
    } catch (error) {
      console.error('Invalid recipient address:', error.message);
      process.exit(1);
    }

    // Check sender balance
    const senderBalance = await connection.getBalance(senderWallet.publicKey);
    const senderBalanceSOL = senderBalance / LAMPORTS_PER_SOL;
    const amountInLamports = amountToSend * LAMPORTS_PER_SOL;

    console.log(`Sender address: ${senderWallet.publicKey.toBase58()}`);
    console.log(`Sender balance: ${senderBalanceSOL.toFixed(4)} SOL`);
    console.log(`Recipient address: ${recipientPublicKey.toBase58()}`);
    console.log(
      `Amount to send: ${amountToSend} SOL (${amountInLamports} lamports)`
    );

    // Check if sender has enough balance (leaving some for transaction fees)
    const minimumBalanceForRentExemption =
      await connection.getMinimumBalanceForRentExemption(0);
    if (senderBalance < amountInLamports + minimumBalanceForRentExemption) {
      console.error(
        `Insufficient balance. You need at least ${
          amountToSend + minimumBalanceForRentExemption / LAMPORTS_PER_SOL
        } SOL`
      );
      process.exit(1);
    }

    // Create and send transaction
    console.log(`${new Date().toISOString()} - Creating transaction...`);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: senderWallet.publicKey,
        toPubkey: recipientPublicKey,
        lamports: amountInLamports,
      })
    );

    console.log(`${new Date().toISOString()} - Sending transaction...`);
    const signature = await connection.sendTransaction(transaction, [
      senderWallet,
    ]);

    console.log(
      `${new Date().toISOString()} - Transaction sent with signature: ${signature}`
    );
    console.log(`${new Date().toISOString()} - Confirming transaction...`);

    await connection.confirmTransaction(signature, 'confirmed');

    console.log(`${new Date().toISOString()} - Transaction confirmed!`);

    // Get updated balance
    const newBalance = await connection.getBalance(senderWallet.publicKey);
    console.log(
      `${new Date().toISOString()} - New sender balance: ${
        newBalance / LAMPORTS_PER_SOL
      } SOL`
    );
  } catch (error) {
    console.error(`${new Date().toISOString()} - Transfer failed:`, error);
    process.exit(1);
  }
}

// Execute the transfer
transferSOL();
