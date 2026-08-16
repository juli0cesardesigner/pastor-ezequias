import { neon } from '@neondatabase/serverless';

export const NEON_DATABASE_URL =
  'postgresql://neondb_owner:npg_f2KbGt5UxABI@ep-red-mode-ac5rnbo0.sa-east-1.aws.neon.tech/neondb?sslmode=require';

export const sql = neon(NEON_DATABASE_URL);
