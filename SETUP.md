# x402scan Setup Guide

## ✅ Completed Steps

1. ✅ Installed dependencies with Node.js 22
2. ✅ Set up Docker containers (PostgreSQL on port 5434, Redis on port 6380)
3. ✅ Created `.env` file
4. ✅ Ran database migrations

## 🔑 Required: Coinbase CDP API Keys

To run the application, you need to get Coinbase CDP credentials:

### How to Get CDP Credentials:

1. **Sign up for Coinbase Developer Platform**
   - Go to: https://portal.cdp.coinbase.com/
   - Create an account or sign in

2. **Create API Keys**
   - Navigate to API Keys section
   - Create a new API key
   - Download the JSON file (keep it secure!)

3. **Extract the values** from the JSON file:
   ```json
   {
     "name": "your-api-key-name",
     "privateKey": "your-private-key",
     "publicKey": "your-public-key"
   }
   ```

4. **Update your `.env` file** with these values:
   ```bash
   CDP_API_KEY_NAME="<name from JSON>"
   CDP_API_KEY_ID="<publicKey from JSON>"
   CDP_API_KEY_SECRET="<privateKey from JSON>"
   ```

5. **Generate a wallet secret** (random string):
   ```bash
   # On macOS/Linux:
   openssl rand -hex 32
   ```
   Add to `.env`:
   ```bash
   CDP_WALLET_SECRET="<generated hex string>"
   ```

6. **Generate a CRON secret** (random string):
   ```bash
   openssl rand -hex 32
   ```
   Add to `.env`:
   ```bash
   CRON_SECRET="<generated hex string>"
   ```

## 🚀 Running the Project

### Start Docker containers (if not running):
```bash
docker-compose up -d
```

### Check container status:
```bash
docker ps | grep x402scan
```

### Start the development server:
```bash
./dev.sh
```

Or manually:
```bash
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
pnpm dev
```

The app will be available at: http://localhost:3000

## 🛠️ Useful Commands

### Database Management:
```bash
# View database in Prisma Studio (main DB)
pnpm db:studio

# View transfers database in Prisma Studio
pnpm db:studio:transfers

# Reset database (careful!)
pnpm db:reset
```

### Docker Management:
```bash
# Stop containers
docker-compose down

# View logs
docker-compose logs -f

# Restart containers
docker-compose restart
```

### Development:
```bash
# Type checking
pnpm check:types

# Linting
pnpm lint

# Format code
pnpm format

# Run tests
pnpm test
```

## 🐛 Troubleshooting

### Node.js Memory Issues
If you get memory errors, make sure you're using Node.js 22:
```bash
node --version  # Should show v22.x.x
```

### Database Connection Issues
Check that Docker containers are running:
```bash
docker ps | grep x402scan
```

### Port Conflicts
- PostgreSQL runs on port 5434 (not the default 5432)
- Redis runs on port 6380 (not the default 6379)

## 📝 Optional: Set Node 22 as Default

To always use Node 22, add to your `~/.zshrc`:
```bash
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
```

Then restart your terminal or run:
```bash
source ~/.zshrc
```

