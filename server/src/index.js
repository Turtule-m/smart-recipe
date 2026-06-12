import './config/env.js';
import app from './app.js';
import { pool } from './db/pool.js';

const port = process.env.PORT || 5000;

const server = app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});

const shutdown = async () => {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
