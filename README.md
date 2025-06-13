# Solana Auto Airdrop Tool

An automated tool to request SOL from Solana devnet every 8 hours. This tool uses GitHub Actions to run automatically without requiring a dedicated server.

## Setup

### Local Setup

1. Clone this repository

   ```bash
   git clone <repository-url>
   cd airdrop-sol-tool
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Configure Solana wallet
   - Generate a new wallet:
     ```bash
     npm run generate-wallet
     ```
   - Or manually configure an existing wallet by editing the `.env` file to set your `SOLANA_KEYPAIR`
4. Run the tool locally:

   ```bash
   npm start
   ```

5. Transfer SOL to another wallet:

   ```bash
   npm run transfer
   ```

   or

   ```bash
   node transferSOL.js
   ```

   Note: The transfer functionality automatically sends the maximum amount of SOL available in your wallet minus 1 SOL (integer value only) to the recipient address configured in your `.env` file.

   Make sure to configure your `.env` file with:

   ```
   RECIPIENT_ADDRESS=<wallet-address-to-receive-sol>
   ```

### GitHub Actions Setup

To use GitHub Actions for automatic operations:

1. Push this code to a GitHub repository
2. In your GitHub repository, go to Settings > Secrets and Variables > Actions
3. Add the following repository secrets:
   - `SOLANA_KEYPAIR`: The array of your wallet's secret key (Example: `[11,22,33,44,...]`)
   - `RECIPIENT_ADDRESS`: The Solana wallet address to receive transferred SOL
4. The GitHub Actions workflows will run automatically:
   - Airdrop workflow: runs every 8 hours to request SOL from devnet
   - Transfer workflow: runs once daily at 12:00 UTC to transfer SOL to the recipient wallet

Both workflows can also be triggered manually from the Actions tab

## Important Notes

- This tool uses Solana devnet for airdrops
- The maximum airdrop amount is 5 SOL per request
- Keep your wallet's secret key secure
- Do not commit the .env file to GitHub

## How It Works

### Airdrop Process

- The tool requests SOL from Solana's devnet faucet
- When run locally, it makes a single request for 5 SOL
- When deployed to GitHub Actions, it runs automatically every 8 hours (configured in `.github/workflows/airdrop.yml`)

### Transfer Process

- Airdropped SOL can be transferred to other wallets using the `transferSOL.js` script
- The transfer script automatically sends the maximum amount of SOL in your wallet minus 1 SOL (integer value only)
- The transfer script uses the `RECIPIENT_ADDRESS` from your `.env` file
- When deployed to GitHub Actions, transfers run automatically once per day at 12:00 UTC (configured in `.github/workflows/transfer.yml`)
