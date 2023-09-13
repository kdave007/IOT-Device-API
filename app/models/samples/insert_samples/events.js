const sql = require("../../db.connection");
const logger = require('../../../debugg/logger');
const deviceEvent = {};

deviceEvent.insertRowNormal = async (deviceId,data) => {

     var mainQuery = `INSERT INTO device_event 
                      SET deviceId="${deviceId}",
                      level= "${data.level}",
                      codeId="${data.code}", 
                      attachedMsg="${(data.content)}", 
                      timestamp=FROM_UNIXTIME(${data.timestamp})`;

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
          console.log(mainQuery);
          logger.setLog("query").fatal(error);
          result = {err:error,data:0};
     });

     return result;
}

deviceEvent.insertRowLive = async (deviceId,data) => {

     var mainQuery = `INSERT INTO device_real_Time_log 
                      SET deviceId="${deviceId}",
                      level= "${data.level}",
                      codeId="${data.code}", 
                      attachedMsg="${(data.content)}", 
                      timestamp=FROM_UNIXTIME(${data.timestamp})`;

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

deviceEvent.setLatestPost = async(deviceId) => {
     var mainQuery = `INSERT INTO device_latest_post `+ 
     `SET deviceId="${deviceId}",pendingWatchdog=1,pendingAlarms=1 `+
     `ON DUPLICATE KEY `+
     `UPDATE pendingWatchdog=1,pendingAlarms=1`;

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

module.exports = deviceEvent;