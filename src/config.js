import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Load a local .env file when present (Node >= 20.12). Real environment
// variables always win, which keeps containers and CI simple.
if (typeof process.loadEnvFile === 'function' && existsSync('.env')) {
  process.loadEnvFile('.env');
}

export const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

export const nodeEnv = process.env.NODE_ENV ?? 'development';
export const isProduction = nodeEnv === 'production';
export const isTest = nodeEnv === 'test';

const parsedPort = Number.parseInt(process.env.PORT ?? '7000', 10);

if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
  throw new Error(`Invalid PORT value: ${process.env.PORT}`);
}

export const port = parsedPort;

export const mongoUri =
  process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/todo';
