#!/usr/bin/env node

import { startServer } from './server';

startServer({ dev: false }).catch(err => {
  console.error(err);
  process.exit(1);
});
