const { DB_CONNECTION } = process.env;

if(typeof DB_CONNECTION === 'undefined') {
    throw new Error('Environment variable DB_CONNECTION must be set to a PostGre database connection string');
}

const { Pool } = require('pg');

const pool = new Pool({connectionString: DB_CONNECTION });

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

module.exports = pool;
