#!/bin/bash

# Helper script to run the development server with Node 22
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"

echo "Using Node.js version: $(node --version)"
echo "Starting development server..."
pnpm dev

