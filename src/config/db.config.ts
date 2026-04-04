import {Pool} from "pg";
import 'dotenv/config';
import fs from 'fs';

const caBundle = fs.readFileSync(new URL('./certs/global-bundle.pem', import.meta.url));

const pool = new Pool({
    host: String(process.env.DB_HOST)?? (()=>{
      throw new Error("host is not defined")
    }),
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: String(process.env.DB_PASSWORD) ?? (()=>{
      throw new Error("password is not defined")
    }),
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: {
      rejectUnauthorized: false,
      ca: caBundle
    }
});

export default pool;