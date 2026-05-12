"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
require("dotenv/config");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const caBundle = fs_1.default.readFileSync(path_1.default.join(process.cwd(), 'src', 'config', 'certs', 'global-bundle.pem'));
const pool = new pg_1.Pool({
    host: String(process.env.DB_HOST) ?? (() => {
        throw new Error("host is not defined");
    }),
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: String(process.env.DB_PASSWORD) ?? (() => {
        throw new Error("password is not defined");
    }),
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: {
        rejectUnauthorized: false,
        ca: caBundle
    }
});
exports.default = pool;
