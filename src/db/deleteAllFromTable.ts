import pool from '../config/db.config';

async function deleteAllFromTable(){
    const tableName= process.argv[2];

    if(!tableName){
        console.log('provide table name');
    };

    try{
        console.log(`Deleting entries from table... \n`)

        const result= await pool.query(`DELETE FROM ${tableName}`);

        if (result.rows.length == 0){
            console.log(`deleted all content from table ${tableName} successfully`);
        }

    }catch(err){
        console.log("getting error: ", err)
    }finally{
        await pool.end();
        process.exit(0);
    };
};

deleteAllFromTable();