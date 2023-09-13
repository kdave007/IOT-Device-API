const sql = require("./db.connection.js");

// constructor
const User = function(user) {
  this.email = user.email,
  this.pass = user.pass
  //this.active = customer.active;
};

User.findUser = (email,pass,response) => {
     sql.query(`SELECT userId,email,name FROM user WHERE email='${email}' 
     AND password='${pass}'`, (err, res) => {
       if (err) {
         console.log("auth model ::error: ", err);
         response(err, null);
         return;
       }
   
       if (res.length) {
         //console.log("auth model :: found valid user: ", res[0]);
         response(null, res[0]);
         return;
       }
   
       // not found User
       response({ kind: "not_found" }, null);
     });
   };


  User.findUserbyName = (name,response) => {
    sql.query(`SELECT userId,email,name FROM user WHERE name='${name}'`, (err, res) => {
      if (err) {
        console.log("find by name model ::error: ", err);
        response(err, null);
        return;
      }
  
      if (res.length) {
        //console.log("auth model :: found valid user: ", res[0]);
        response(null, res[0]);
        return;
      }
  
      // not found User
      response({ kind: "not_found" }, null);
    });
  };

  User.findUserbyEmail = (email,response) => {
    sql.query(`SELECT * FROM user WHERE email='${email}' LIM 1`, (err, res) => {
      if (err) {
        console.log("find user by email ::error: ", err);
        response(err, null);
        return;
      }
  
      if (res.length) {
        //console.log("auth model :: found valid user: ", res[0]);
        response(null, res[0]);
        return;
      }
  
      // not found User
      response({ kind: "not_found" }, null);
    });
  };


  User.getAll = async () => {// this is the correct structure for synch queries functions...
    let result = null;
    const mainQuery = `SELECT userId,name,level,email FROM user ORDER BY userId`;
    let con = await sql.connect();
    await con.query(mainQuery).then( ([rows,fields]) => {// await this promise
        result = {err:null,data:rows};
        con.end()
      })
      .catch((error)=>{//handle error
        console.log(error);
        result = {err:error,data:null};
      });   
    return result;
   };

   User.getAdminsIDs = async () => {
    const mainQuery =`SELECT userId,name FROM user WHERE level=1 ORDER BY userId`;
    let con = await sql.connect();

    await con.query( mainQuery).then( ([rows,fields]) => {// await this promise
         let cleanData = null;
     
         if (rows.length) {
           result = {err:null,data:rows};
         }else{
           result = {err:null,data:false};
         }
         
         con.end()
       })
       .catch((error)=>{//handle error

         logger.setLog("query").fatal(error);
         result = {err:error,data:null};
       });

     return result;
}
   
  module.exports = User;