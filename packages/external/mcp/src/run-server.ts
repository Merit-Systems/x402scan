#!/usr/bin/env node

import { log } from './lib/log';
import { startServer } from './server';

startServer({ dev: false }).catch(() => {
  log.error('server died');
  process.exit(1);
});
