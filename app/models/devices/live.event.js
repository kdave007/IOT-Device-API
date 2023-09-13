const sql = require("../../models/db.connection");
const logger = require('../../debugg/logger');

/**
 * @brief
 *  CLASS
 *  Query the values for live events config
 *  
 */

const realTimeEvent = {};

realTimeEvent.getToUpdate = async (deviceId) => {
     const mainQuery = `SELECT deviceId,configId,value,pending
      FROM real_time_events_config
      WHERE deviceId= ${deviceId} `;
      
      let con = await sql.connect();
      await con.query( mainQuery).then( ([rows,fields]) => {// await this promise
      
          if (rows.length) {
               result = {err:null,data:rows};
               console.table(rows);
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

realTimeEvent.inDefaultRow = async (deviceId,configId,value,pending) => {
     var mainQuery = `INSERT INTO real_time_events_config
                  SET deviceId=${deviceId},configId=${configId},value=${value},pending=${pending}`;

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


realTimeEvent.setAck = async (deviceId) => {
     const mainQuery =`UPDATE real_time_events_config 
                       SET pending=0 
                       WHERE deviceId=${deviceId} AND pending=1`;

     let con = await sql.connect();

     await con.query( mainQuery).then( ([rows,fields]) => {// await this promise
     console.log("setACK time event config rows affected: ",rows.affectedRows);
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

module.exports = realTimeEvent;