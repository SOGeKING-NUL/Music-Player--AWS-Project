import {Pool} from "pg";
import 'dotenv/config';
import fs from 'fs';

const caBundle = fs.readFileSync(new URL('./global-bundle.pem', import.meta.url));

const pool = new Pool({
    host: 'music-player-db.cbs4e4gim1z4.ap-south-1.rds.amazonaws.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: String(process.env.DB_PASSWORD || ''),
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: {
      rejectUnauthorized: false,
      ca: caBundle
    }
});

export default pool;