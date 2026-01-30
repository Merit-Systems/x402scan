import type { RegisterPrompts } from './types';

/**
 * # Getting Started with x402scan
 *
 * This prompt guides users through the complete onboarding workflow
 * to make their first paid API call using x402 micropayments.
 *
 * ## Workflow Steps:
 * 1. Check wallet status with `get_wallet_info`
 * 2. Optionally redeem invite code with `redeem_invite`
 * 3. Discover APIs with `discover_api_endpoints`
 * 4. Check endpoint details with `check_endpoint_schema`
 * 5. Make paid request with `fetch` or `fetch_with_auth`
 */
const PROMPT_CONTENT = `# Getting Started with x402scan

You are helping the user get started with x402scan, an MCP server for calling x402-protected APIs with automatic micropayment handling.

## Your Goal

Guide the user through the complete onboarding workflow to make their first paid API call.

## Step-by-Step Workflow

### Step 1: Check Wallet Status

First, use \`get_wallet_info\` to check the wallet status. This will:

- Show the wallet address (auto-created at \`~/.x402scan-mcp/wallet.json\` on first run)
- Display current USDC balance on Base
- Provide a deposit link if funding is needed

If the wallet has 0 balance, the user needs to deposit USDC on Base before proceeding.

### Step 2: Redeem Invite Code (Optional)

If the user has an invite code, use \`redeem_invite\` to claim free USDC credits.

If they don't, you should send them to this link: https://www.x402scan.com/deposit/<their_wallet_address> to purchase some USDC.

### Step 3: Discover Available APIs

Use \`discover_api_endpoints\` to find x402-protected endpoints on a target origin. For example:

- \`enrichx402.com\` - Data enrichment APIs
- \`stablestudio.io\` - AI image generation APIs

This returns a list of available endpoints with their pricing and schemas.

### Step 4: Check Endpoint Details (Optional)

Use \`check_endpoint_schema\` to probe a specific endpoint for:

- Pricing information
- Required parameters schema
- Authentication requirements (SIWX if applicable)

### Step 5: Make a Paid Request

Use \`fetch\` (or \`fetch_with_auth\` for SIWX-protected endpoints) to make the actual API call. The payment is handled automatically from the user's USDC balance.

## Key Information

- **Network**: Base (eip155:8453)
- **Currency**: USDC
- **Wallet Location**: \`~/.x402scan-mcp/wallet.json\`
- **Protocol**: x402 (HTTP 402 Payment Required with crypto micropayments)

## Example Conversation Flow

1. "Let me check your wallet status first..."
2. "Your wallet has X USDC. Here are the available APIs you can call..."
3. "Which API would you like to use?"
4. "Here's the endpoint schema. What parameters would you like to use?"
5. "Making the request..." → Return the result

## Important Notes

- Always check wallet balance before attempting paid requests
- Explain the cost before making a request
- If balance is low, suggest the deposit link
- For SIWX-protected endpoints, use \`fetch_with_auth\` instead of \`fetch\`
`;

export const registerGettingStartedPrompt: RegisterPrompts = ({ server }) => {
  server.registerPrompt(
    'getting_started',
    {
      title: 'Getting Started',
      description:
        'Step-by-step guide to set up your wallet and make your first x402 API call',
    },
    () => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: PROMPT_CONTENT,
          },
        },
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please help me get started with x402scan. Walk me through the setup process.`,
          },
        },
      ],
    })
  );
};
