"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_config_1 = __importDefault(require("../config/db.config"));
async function deleteAllFromTable() {
    const tableName = process.argv[2];
    if (!tableName) {
        console.log('provide table name');
    }
    ;
    try {
        console.log(`Deleting entries from table... \n`);
        const result = await db_config_1.default.query(`DELETE FROM ${tableName}`);
        if (result.rows.length == 0) {
            console.log(`deleted all content from table ${tableName} successfully`);
        }
    }
    catch (err) {
        console.log("getting error: ", err);
    }
    finally {
        await db_config_1.default.end();
        process.exit(0);
    }
    ;
}
;
deleteAllFromTable();
