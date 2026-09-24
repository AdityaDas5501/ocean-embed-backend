import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5433,
  database: process.env.POSTGRES_DB || 'ocean_db',
  user: process.env.POSTGRES_USER || 'ocean_user',
  password: process.env.POSTGRES_PASSWORD || 'ocean_secret_pass',
});

// Test connection
pool.on('connect', () => {
  console.log('Connected to the PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;
