import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load the .env file
dotenv.config({ path: ".env" });

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not found in .env');

export default defineConfig({
  schema: "./src/lib/schema.ts",
  out: "./drizzle",
  dialect: "postgresql", 
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});