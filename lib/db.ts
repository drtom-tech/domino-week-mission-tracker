// lib/db.ts
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

// Go up one level (from `lib`) to the root, then into `drizzle`
import * as schema from '../drizzle/schema'; 

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });