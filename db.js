const mysql = require("mysql");

// const db = mysql.createConnection({
//   host: "db4free.net",
//   user: "shashankmrit",
//   password: "123456789",
//   database: "bloodbankmrit",
//   port: "3306",
//   multipleStatements: true
// });

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "blood-bank",
  port: "3303",
  multipleStatements: true
});



db.connect((err) => {
  if (err) {
    console.log("Error in Conntecting Msql ", err);
  } else {
    console.log("MySQL Connected succesfully");
  }
});
module.exports = db;
