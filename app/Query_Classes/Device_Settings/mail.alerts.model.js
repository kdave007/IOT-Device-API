const sql = require("../../Data_Base/db.connection");
const logger = require('../../Auxiliary_Classes/logger');
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
          logger.setLog("query").fatal(error);
          result = {err:error,data:null};
        });   
      return result;
};


MailAlerts.getAlertParams = async (deviceId) => {
     let con = await sql.connect();
     const mainQuery = `SELECT * FROM user_mail_alerts WHERE deviceId=${deviceId} ORDER BY deviceId AND id`;
     await con.query( mainQuery).then( ([rows,fields]) => {// await this promise
               result = {err:null,data:rows};
               con.end()
          })
          .catch((error)=>{//handle error
               logger.setLog("query").fatal(error);
               result = {err:error,data:null};
          });   
      return result;
};

MailAlerts.getAlertParamsbyType = async (typeID) => {
     let con = await sql.connect();
     const mainQuery = `SELECT * FROM user_mail_alerts WHERE alertType=${typeID} ORDER BY alertType`;
     await con.query( mainQuery).then( ([rows,fields]) => {// await this promise
               result = {err:null,data:rows};
               con.end()
          })
          .catch((error)=>{//handle error
               logger.setLog("query").fatal(error);
               result = {err:error,data:null};
          });   
      return result;
};

MailAlerts.getUsersbyID = async (typeID,deviceId) => {
     let con = await sql.connect();
     const mainQuery = `SELECT user_mail_alerts.userId,user.name,user.email
          FROM user_mail_alerts 
          RIGHT JOIN user 
          ON user_mail_alerts.userId = user.userId
          WHERE alertType=${typeID} AND deviceId = ${deviceId} ORDER BY userId;`;
     await con.query( mainQuery).then( ([rows,fields]) => {// await this promise
               result = {err:null,data:rows};
               con.end()
          })
          .catch((error)=>{//handle error
               logger.setLog("query").fatal(error);
               result = {err:error,data:null};
          });   
      return result;
}

module.exports = MailAlerts;