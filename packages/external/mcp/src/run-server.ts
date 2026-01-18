import { startServer } from "./server";

void startServer({ dev: false }).catch(err => {
  console.error(err);
  process.exit(1);
});