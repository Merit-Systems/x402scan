# Publishing Guide

This guide will help you publish the `facilitators` package to npm.

## Prerequisites

1. Create an npm account at https://www.npmjs.com/signup
2. Login to npm from your terminal:
   ```bash
   npm login
   ```

## Before Publishing

### 1. Update Package Name (if needed)

If `facilitators` is already taken on npm, update the name in `package.json`:

```json
{
  "name": "@your-org/facilitators",
  // or
  "name": "x402-facilitators",
  ...
}
```

### 2. Update Package Metadata

Edit `package.json` to add your information:

```json
{
  "author": "Your Name <your.email@example.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/your-username/your-repo.git",
    "directory": "facilitators"
  }
}
```

### 3. Verify the Build

```bash
pnpm build
pnpm typecheck
```

### 4. Test Locally

Test the package locally before publishing:

```bash
# In the facilitators directory
pnpm pack

# This creates a facilitators-0.0.1.tgz file
# Install it in another project to test:
cd /path/to/test/project
npm install /path/to/facilitators/facilitators-0.0.1.tgz
```

## Publishing

### First Release

```bash
# Make sure you're in the facilitators directory
cd /Users/jasonhedman/workspace/merit/x402-leaderboard/facilitators

# Build the package
pnpm build

# Publish to npm (this will run prepublishOnly script automatically)
npm publish

# If you're using a scoped package (@your-org/facilitators)
npm publish --access public
```

### Subsequent Releases

1. Update the version:

   ```bash
   npm version patch   # 0.0.1 -> 0.0.2 (bug fixes)
   npm version minor   # 0.0.2 -> 0.1.0 (new features)
   npm version major   # 0.1.0 -> 1.0.0 (breaking changes)
   ```

2. Publish:
   ```bash
   npm publish
   ```

## Package Structure

After publishing, users can import:

```typescript
// Main export - all runtime code and types
import { FACILITATORS, FACILITATORS_BY_CHAIN, Chain } from 'facilitators';

// Types only export - better for tree-shaking
import type { Facilitator, Token } from 'facilitators/types';
```

## Verification

After publishing, verify the package:

1. View on npm: `https://www.npmjs.com/package/facilitators`
2. Install in a test project:
   ```bash
   npm install facilitators
   ```
3. Test the imports work correctly

## Troubleshooting

### Package name already exists

Change the name in `package.json` to something unique or use a scoped package:

```json
{
  "name": "@your-org/facilitators"
}
```

### Build fails before publish

The `prepublishOnly` script will run `pnpm build` automatically. Make sure:

- All dependencies are installed
- No TypeScript errors exist
- `tsup` is in devDependencies

### Files missing in published package

Check the `files` field in `package.json`. Currently includes:

- `dist/` - Built files
- `README.md` - Documentation
- `LICENSE` - License file

The `.npmignore` file ensures `src/` and other source files are excluded.

## Continuous Integration

Consider setting up automated publishing with GitHub Actions:

1. Add npm token to GitHub secrets
2. Create `.github/workflows/publish.yml`
3. Automate version bumps and publishing

## Support

For issues or questions:

- GitHub Issues: [your-repo-url]/issues
- Email: your.email@example.com
