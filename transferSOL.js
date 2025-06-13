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

const recipientAddress = process.env.RECIPIENT_ADDRESS;

if (!recipientAddress) {
  console.error('Error: RECIPIENT_ADDRESS is not defined in .env file');
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

    // Calculate amount to send: maximum balance minus 1 SOL, and take only the integer part
    const reserveAmount = 1; // Keep 1 SOL in the wallet
    let amountToSend = Math.floor(senderBalanceSOL - reserveAmount);

    // Make sure we're not trying to send a negative amount
    if (amountToSend <= 0) {
      console.error(
        `Insufficient balance. You have ${senderBalanceSOL.toFixed(
          4
        )} SOL, need more than ${reserveAmount} SOL to transfer`
      );
      process.exit(1);
    }

    const amountInLamports = amountToSend * LAMPORTS_PER_SOL;

    console.log(`Sender address: ${senderWallet.publicKey.toBase58()}`);
    console.log(`Sender balance: ${senderBalanceSOL.toFixed(4)} SOL`);
    console.log(`Recipient address: ${recipientPublicKey.toBase58()}`);
    console.log(
      `Amount to send: ${amountToSend} SOL (${amountInLamports} lamports)`
    );
    console.log(`Amount to keep: ${reserveAmount} SOL`);

    // Check if we need additional fees
    const minimumBalanceForRentExemption =
      await connection.getMinimumBalanceForRentExemption(0);
    const transactionFee = minimumBalanceForRentExemption / LAMPORTS_PER_SOL;

    // Make sure we have enough for the transaction fee and the reserve amount
    if (senderBalanceSOL < amountToSend + transactionFee) {
      // Adjust amount to send to account for transaction fees
      amountToSend = Math.floor(
        senderBalanceSOL - reserveAmount - transactionFee
      );

      if (amountToSend <= 0) {
        console.error(
          `Insufficient balance after accounting for transaction fees. You have ${senderBalanceSOL.toFixed(
            4
          )} SOL, need more than ${
            reserveAmount + transactionFee
          } SOL to transfer`
        );
        process.exit(1);
      }

      console.log(
        `Adjusted amount to send (accounting for fees): ${amountToSend} SOL`
      );
    }

    // Create and send transaction
    console.log(`${new Date().toISOString()} - Creating transaction...`);

    // Recalculate lamports based on potentially adjusted amountToSend
    const finalAmountInLamports = amountToSend * LAMPORTS_PER_SOL;

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: senderWallet.publicKey,
        toPubkey: recipientPublicKey,
        lamports: finalAmountInLamports,
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
