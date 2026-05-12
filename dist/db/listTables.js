"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_config_1 = __importDefault(require("../config/db.config"));
async function listTable() {
    console.log('Listing Tables:\n');
    try {
        const result = await db_config_1.default.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);
        console.log('Tables in database:');
        result.rows.forEach((row) => {
            console.log(`- ${row.table_name}`);
        });
        console.log(`\nTotal tables: ${result.rowCount}`);
    }
    catch (err) {
        console.error('Error while listing tables:', err);
    }
    finally {
        await db_config_1.default.end();
        process.exit(0);
    }
}
listTable();
