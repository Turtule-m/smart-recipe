import '../config/env.js';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pool } from './pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const schemaPath = join(__dirname, 'schema.sql');

try {
  const schema = await readFile(schemaPath, 'utf8');
  await pool.query(schema);
  console.log('Database schema applied.');
} catch (error) {
  console.error('Failed to apply database schema:', error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
