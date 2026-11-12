import { createServer } from 'node:http';

import mongoose from 'mongoose';

import { createApp } from './app.js';
import { mongoUri, port } from './config.js';
import { connectDb } from './db.js';

function redact(uri) {
  return uri.replace(/\/\/([^@/]+)@/, '//***@');
}

async function main() {
  await connectDb(mongoUri);
  console.log(`MongoDB connected (${redact(mongoUri)})`);

  const app = createApp();
  const server = createServer(app);

  server.listen(port, () => {
    console.log(`Todo app listening on http://localhost:${port}`);
  });

  const shutdown = (signal) => {
    console.log(`\n${signal} received, shutting down...`);

    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });

    // Do not hang forever if a connection refuses to close.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((error) => {
  console.error(`Failed to start: ${error.message}`);
  process.exitCode = 1;
});
