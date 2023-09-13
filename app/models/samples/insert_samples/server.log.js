const sql = require("../../db.connection");
const logger = require('../../../debugg/logger');

const serverLog = {};

serverLog.insertRow = async (deviceId,content) => {

     var mainQuery = `INSERT INTO server_log 
                      SET deviceId=${deviceId},
                      log= "${content}"`;

     let con = await sql.connect();
     await con.query( mainQuery).then( ([rows,fields]) => {// await this promise

     if (rows.affectedRows) {
          result = {err:null,data:rows.affectedRows};
     }else{
          result = {err:null,data:0};
     }
     
     con.end();
     })
     .catch((error)=>{//handle error
          logger.setLog("query").fatal(error);
          result = {err:error,data:0};
     });

     return result;
}

module.exports = serverLog;