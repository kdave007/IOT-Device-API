const sql = require("../../models/db.connection");
const logger = require('../../debugg/logger');

/**
 * @brief
 *  CLASS
 *  Query the values of device advanced configuration
 *  
 */

 const advancedConfig = {};

 advancedConfig.getToUpdate = async (deviceId) => {
     const mainQuery = `SELECT deviceId,configId,value,pending
      FROM advanced_config
      WHERE deviceId= ${deviceId} 
      ORDER BY configId`;
      
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

 advancedConfig.getKey = async(deviceId)=>{
     const mainQuery = `SELECT deviceId,configId,value,pending
     FROM advanced_config
     WHERE deviceId= ${deviceId} AND configId=5`;//id 5 points to KEY
     
     let con = await sql.connect();
     await con.query( mainQuery).then( ([rows,fields]) => {// await this promise
     
         if (rows.length) {
              result = {err:null,data:rows};
              console.table(rows);
         }else{
              result = {err:null,data:false};
              logger.setLog('server').error(`advanced config :: deviceId ${deviceId} : KEY PASS not found !!`);
         }    
        
         con.end()
       })
       .catch((error)=>{//handle error
         logger.setLog("query").fatal(error);
         result = {err:error,data:null};
       });

     return result;
 }

 advancedConfig.setKey = async(deviceId,newKEY)=>{
     const mainQuery =`INSERT INTO advanced_config SET value ='${newKEY}',deviceId=${deviceId},configId=5,pending=1`;

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

advancedConfig.inDefaultRow = async (devId,configId,value,pending) => {

     var mainQuery = `INSERT INTO advanced_config 
                  SET deviceId=${devId},configId=${configId},value=${value},pending=${pending}`;

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

advancedConfig.setAck = async (deviceId) => {
     const mainQuery =`UPDATE advanced_config 
                     SET pending=0 
                     WHERE deviceId=${deviceId} AND pending=1`;

     let con = await sql.connect();

     await con.query( mainQuery).then( ([rows,fields]) => {// await this promise
          console.log("setACK advancedConfig rows affected: ",rows.affectedRows);
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



module.exports = advancedConfig;
