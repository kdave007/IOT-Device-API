const sql = require('../../../models/db.connection');
const logger = require('../../../debugg/logger');

const serverOTALog = {};

serverOTALog.insertRow = async (deviceId,content,ip) => {

     var mainQuery = `INSERT INTO ota_server_log 
                      SET deviceID=${deviceId},
                      log="${content}",
                      ip="${ip}"`;

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

module.exports = serverOTALog;