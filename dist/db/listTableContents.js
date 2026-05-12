"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_config_1 = __importDefault(require("../config/db.config"));
async function listTableContents() {
    const tableName = process.argv[2];
    if (!tableName) {
        console.error('table doesnt exist');
        process.exit(1);
    }
    try {
        console.log(`Fetching data from ${tableName}...\n`);
        const result = await db_config_1.default.query(`SELECT * FROM ${tableName} ORDER BY created_at DESC`);
        if (result.rows.length === 0) {
            console.log(`No data found in ${tableName}`);
        }
        else {
            console.log(`Found ${result.rows.length} rows:\n`);
            console.table(result.rows);
        }
    }
    catch (err) {
        if (err.code === '42P01') {
            console.error(`Table "${tableName}" does not exist`);
        }
        else {
            console.error('Error:', err.message);
        }
    }
    finally {
        await db_config_1.default.end();
        process.exit(0);
    }
}
listTableContents();
