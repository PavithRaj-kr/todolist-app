import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// This forces the app to look for the environment variable
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in .env');
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql);