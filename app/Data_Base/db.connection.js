const mysql = require("mysql2/promise");
const dbConfig = require("./db.config");

// Create a connection to the database
async function connect(){
     return connection = await mysql.createPool({
          host: dbConfig.HOST,
          user: dbConfig.USER,
          password: dbConfig.PASSWORD,
          database: dbConfig.DB,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0
        });
}


// open the MySQL connection
// connection.connect(error => {
//   if (error) throw error;
//   console.log("db.connection : Successfully connected to the database.");
// });

module.exports = {connect};
