import 'server-only';
import { neon } from '@neondatabase/serverless';
export function database() {
 const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
 return url ? neon(url) : null;
}
export const databaseConfigured = () => Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL);
