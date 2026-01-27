#!/usr/bin/env node

import { log } from './shared/log';
import { startServer } from './server';

startServer({ dev: false }).catch(err => {
  log.error(String(err));
  process.exit(1);
});
