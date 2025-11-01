const mysql = require('mysql2'); // appelle le module Mysql2 https://sidorares.github.io/node-mysql2/docs

// Connexion à la base de données 
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});


// test de connexion à la BDD
connection.connect(err => {
  if (err) {
    console.error('Erreur de connexion à la BDD :', err.message);
  } else {
    console.log('Connexionà la BDD OK :', process.env.DB_NAME);
  }
});

module.exports = connection;