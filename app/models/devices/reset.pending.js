const sql = require("../db.connection");
const logger = require('../../debugg/logger');
     //OSBOLETE CLASS <-------------------------------------------------------------------------------------
/**
 * @brief
 *  CLASS
 *  Query the reset device  flag, used to know if we have 
 *  a pending reset to send
 *  
 */

const pendingReset={}

pendingReset.insert = async (deviceId) => {
     var mainQuery = `INSERT INTO misc_device_values
                  SET deviceId=${deviceId},configId=2,value="pending reset",pending=0`;

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

pendingReset.setPending = async (deviceId,state) => {
     const mainQuery =`UPDATE misc_device_values 
                       SET pending=${state} 
                       WHERE deviceId=${deviceId} AND configId=2`;

     let con = await sql.connect();

     await con.query( mainQuery).then( ([rows,fields]) => {// await this promise
     console.log("setACK to pending reset TO: ",state," , rows affected: ",rows.affectedRows);
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


pendingReset.get = async (deviceId) =>{
     const mainQuery = `SELECT deviceId,configId,value,pending
      FROM misc_device_values
      WHERE deviceId= ${deviceId} AND configId=2`;
      
      let con = await sql.connect();
      await con.query( mainQuery).then( ([rows,fields]) => {// await this promise
      
          if (rows.length) {
               result = {err:null,data:rows[0]};
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

module.exports= pendingReset;