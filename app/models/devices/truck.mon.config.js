const sql = require("../../models/db.connection");
const logger = require('../../debugg/logger');

/**
 * @brief
 *  CLASS
 *  Query the  values for the truck monitor configurations
 *  
 */

const truckMonitor = {};

truckMonitor.getToUpdate = async (deviceId) => {
     const mainQuery = `SELECT deviceId,configId,value,pending
      FROM truck_monitor_config
      WHERE deviceId= ${deviceId}`;
      
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

truckMonitor.inDefaultRow = async (deviceId,configId,value,pending) => {
     var mainQuery = `INSERT INTO truck_monitor_config
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

truckMonitor.setAck = async (deviceId) => {
     const mainQuery =`UPDATE truck_monitor_config 
                       SET pending=0 
                       WHERE deviceId=${deviceId} AND pending=1`;

     let con = await sql.connect();

     await con.query( mainQuery).then( ([rows,fields]) => {// await this promise
     console.log("setACK truck monitor rows affected: ",rows.affectedRows);
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

module.exports = truckMonitor;