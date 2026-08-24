import 'dotenv/config';
import { Pool } from 'pg';

// PostGres Credentials
const pool = new Pool({
    user: process.env.USER,
    host: process.env.DB_HOST,
    database: process.env.DATABASE,
    password: process.env.PASSWORD,
    port: 5432
});

export default pool;