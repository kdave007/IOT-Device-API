const sql = require("../../Data_Base/db.connection");
const logger = require('../../Auxiliary_Classes/logger');

const events = {}

events.allUnseenLogs = async () => {
     const mainQuery = `SELECT rowId,deviceId,timestamp,attachedMsg,codeId,level,seen 
     FROM device_real_Time_log 
     WHERE seen=0`;

     let con = await sql.connect();
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

events.setLogSeen = async (rowId) => {
    const mainQuery =`UPDATE device_real_Time_log 
                     SET seen=1 
                     WHERE rowId=${rowId}`;
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

module.exports = events;
