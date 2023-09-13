const sql = require("../models/db.connection");

// constructor
const MailAlerts = function() {};

MailAlerts.getAlertsbyDevice =(deviceId,response) => {
     const mainQuery = `SELECT * FROM user_mail_alerts WHERE deviceId=${deviceId} ORDER BY deviceId`;
     sql.query( mainQuery,(err,answer) => {
          if (err) {
               console.log("mail alerts by device model ::error: ", err);
               response(err, null);
               return;
          }
          if (answer.length) {
              //let cleanData = cleanNULLS(answer);
               response(null, cleanData);
               return;
          }
          // not found User
          response({ kind: "not_found" }, null);   
     });
};

MailAlerts.getAlertsbyUser = async (userId) => {
     let con = await sql.connect();
     const mainQuery = `SELECT * FROM user_mail_alerts WHERE userId=${userId} ORDER BY deviceId AND id`;
     await con.query( mainQuery).then( ([rows,fields]) => {// await this promise
          result = {err:null,data:rows};
          con.end()
        })
        .catch((error)=>{//handle error
          console.log(error);
          result = {err:error,data:null};
        });   
      return result;
};

module.exports = MailAlerts;