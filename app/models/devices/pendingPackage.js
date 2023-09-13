const sql = require("../db.connection");
const logger = require('../../debugg/logger');

/**
 * @brief
 *  CLASS
 *  Query the package  flag, used to know if we have 
 *  a pending package to send, and to send the WIFI and L-MOD
 *  
 */

 //CHECK AND DELETE OBSOLETE FUNCTIONS <----------------------------------------------------

const pendingPackage={}

pendingPackage.getSlotsWaiting = async(deviceId) =>{
     const mainQuery = `SELECT value,pending
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

pendingPackage.updateSlotsWaiting = async(deviceId,value) =>{
     var mainQuery = `INSERT INTO misc_device_values
                  SET deviceId=${deviceId},configId=2,value="${value}",pending=1
                  ON DUPLICATE KEY UPDATE value="${value}",pending=1`;
     console.log(mainQuery);
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

pendingPackage.update = async (deviceId,value) => {
     const mainQuery =`INSERT misc_device_values 
                       SET value="${value}",deviceId=${deviceId},configId=1,pending=1  
                       ON DUPLICATE KEY UPDATE value="${value}"`;

     let con = await sql.connect();

     await con.query( mainQuery).then( ([rows,fields]) => {// await this promise
     console.log("update/insert package record ",rows.affectedRows);
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

pendingPackage.setTrue = async (deviceId) => {
     var mainQuery = `INSERT INTO misc_device_values
                  SET deviceId=${deviceId},configId=1,value="pending package",pending=1
                  ON DUPLICATE KEY UPDATE pending=1`;

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

pendingPackage.setPending = async (deviceId,state) => {
     const mainQuery =`UPDATE misc_device_values 
                       SET pending=${state} 
                       WHERE deviceId=${deviceId} AND configId=1`;

     let con = await sql.connect();
     console.log(` pending to ${state}`);

     await con.query( mainQuery).then( ([rows,fields]) => {// await this promise
     console.log("setACK to pending package rows affected: ",rows.affectedRows);
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

pendingPackage.comprobe = async (deviceId) => {
     let result = await get(deviceId);

     if(result.err==null){
          if(result.data){
               return {err:null,query:true ,pending: result.data[0].pending};
          }
          return {err:null,query:false, pending:null};
     }
     return {err: result.err, query:false ,pending:null};
};

pendingPackage.get = async (deviceId) =>{
     const mainQuery = `SELECT deviceId,configId,value,pending
      FROM misc_device_values
      WHERE deviceId= ${deviceId} AND configId=1`;
      
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

module.exports= pendingPackage;