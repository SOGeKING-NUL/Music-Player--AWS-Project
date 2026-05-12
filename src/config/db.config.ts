import { Pool } from "pg";
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const caBundle = fs.readFileSync(path.join(process.cwd(), 'src', 'config', 'certs', 'global-bundle.pem'));  //doing so ensures that the path is resolved correctly when it is run from the dist folder and it finds the certificate since it does not get reproduced in the dist folder

const pool = new Pool({
    host: String(process.env.DB_HOST) ?? (() => {
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