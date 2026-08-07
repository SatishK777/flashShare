// setup.ts
process.env.NODE_ENV = 'test';

// If you want to run purely isolated unit tests, you would mock Prisma here.
// Since these are integration tests, we'll let Prisma connect to the actual database.
// Ensure DATABASE_URL is set appropriately in your testing environment.

import { beforeAll, afterAll } from 'vitest';
import { prisma } from '../config/database.js'; // Adjust path if needed

beforeAll(async () => {
  // Any global setup
});

afterAll(async () => {
  // Any global teardown
  // @ts-ignore
  if (prisma && typeof prisma.$disconnect === 'function') {
    await prisma.$disconnect();
  }
});
