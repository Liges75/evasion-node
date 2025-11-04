// appelle le module Mysql2 https://sidorares.github.io/node-mysql2/docs

const mysql = require('mysql2');

//Création d’un pool de connexions MySQL //Version async/await et query classique
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,   // Attend qu’une connexion soit libre
  connectionLimit: 10,        // Nombre max de connexions simultanées
  queueLimit: 0               // 0 = file d’attente illimitée
});



// Export direct du pool (classique) + version promesse
const promisePool = pool.promise();

module.exports = {
  pool,         // usage avec callbacks : db.pool.query(...)
  promisePool   // usage avec async/await : db.promisePool.query(...)
};