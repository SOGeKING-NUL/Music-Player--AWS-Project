"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_config_1 = __importDefault(require("../config/db.config"));
async function dropTables() {
    try {
        console.log('Dropping tables...\n');
        // Drop tables in reverse order of dependencies
        await db_config_1.default.query(`DROP TABLE IF EXISTS songs CASCADE;`);
        console.log('Dropped songs table');
        await db_config_1.default.query(`DROP TABLE IF EXISTS albums CASCADE;`);
        console.log('Dropped albums table');
        await db_config_1.default.query(`DROP TABLE IF EXISTS artists CASCADE;`);
        console.log('Dropped artists table');
        console.log('\nAll tables dropped successfully!');
    }
    catch (err) {
        console.error('Error dropping tables:', err);
    }
    finally {
        await db_config_1.default.end();
        process.exit(0);
    }
}
dropTables();
