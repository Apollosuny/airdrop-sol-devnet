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
   npm run transfer <RECIPIENT_ADDRESS> <AMOUNT_SOL>
   ```
   or
   ```bash
   node transferSOL.js <RECIPIENT_ADDRESS> <AMOUNT_SOL>
   ```
   Example:
   ```bash
   node transferSOL.js 7UX2i7SucgLMQcfZ75s3VXmZZY4YRUyJN9X1RgfMoDUi 1.5
   ```

### GitHub Actions Setup

To use GitHub Actions for automatic airdrops every 8 hours:

1. Push this code to a GitHub repository
2. In your GitHub repository, go to Settings > Secrets and Variables > Actions
3. Add a new repository secret named `SOLANA_KEYPAIR` with the value being the array of your wallet's secret key
   Example: `[11,22,33,44,...]`
4. The GitHub Actions workflow will run automatically every 8 hours, or you can trigger it manually from the Actions tab

## Important Notes

- This tool uses Solana devnet for airdrops
- The maximum airdrop amount is 5 SOL per request
- Keep your wallet's secret key secure
- Do not commit the .env file to GitHub

## How It Works

- The tool requests SOL from Solana's devnet faucet
- When run locally, it makes a single request for 5 SOL
- When deployed to GitHub Actions, it runs automatically every 8 hours (configured in `.github/workflows/airdrop.yml`)
- Airdropped SOL can be transferred to other wallets using the `transferSOL.js` script
