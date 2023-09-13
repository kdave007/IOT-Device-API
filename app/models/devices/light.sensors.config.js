const sql = require("../../models/db.connection");
const logger = require('../../debugg/logger');

/**
 * @brief
 *  CLASS
 *  Query the values related to light pcb modules, and light sensors config
 *  
 */

const lightSensConfig = {};

lightSensConfig.getModSettings = async (deviceId) => {

     const mainQuery =`SELECT  moduleCode,deviceId,modulePos,enable,moduleAddress,pending
     FROM ligth_sens_mod_code
     WHERE deviceId =${deviceId}`;

     let con = await sql.connect();
      await con.query( mainQuery).then( ([rows,fields]) => {// await this promise
      
          if (rows.length) {
               result = {err:null,data:rows};
              // console.table(rows);
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

lightSensConfig.getSensConfig = async (moduleCode) => {

     const mainQuery =`SELECT rowId,moduleCode,sensor,treshold,edge,filter,statusActive 
     FROM ligth_sens_config
     WHERE moduleCode=${moduleCode}
     ORDER BY sensor ASC`;

     let con = await sql.connect();
      await con.query( mainQuery).then( ([rows,fields]) => {// await this promise
      
          if (rows.length) {
               result = {err:null,data:rows};
               //console.table(rows);
          }else{
               result = {err:null,data:false};
               console.log("light sensor settings :: zero rows");
          }    
         
          con.end()
        })
        .catch((error)=>{//handle error
          logger.setLog("query").fatal(error);
          result = {err:error,data:null};
        });

      return result;
} 

lightSensConfig.setAck = async (deviceId) => {
     const mainQuery =`UPDATE ligth_sens_mod_code 
                     SET pending=0 
                     WHERE deviceId=${deviceId} AND pending=1`;

     let con = await sql.connect();

     await con.query( mainQuery).then( ([rows,fields]) => {// await this promise
          console.log("setACK light_sens_mod_code rows affected: ",rows.affectedRows);
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


lightSensConfig.insertDefRow = async (deviceId,modulePos,enable,address,pending,nextFunction) => {
     const mainQuery = `INSERT INTO ligth_sens_mod_code 
                  SET deviceId=${deviceId},modulePos=${modulePos},enable=${enable},
                  moduleAddress=${address},pending=${pending}`;

     let con = await sql.connect();
     await con.query( mainQuery).then( ([rows,fields]) => {// await this promise

     if (rows.affectedRows) {
          result = {err: null, data: rows.affectedRows, insertedId: rows.insertId};
     }else{
          result = {err:null,data:0};
     }
     
     con.end();
     })
     .catch((error)=>{//handle error
          logger.setLog("query").fatal(error);
          logger.setLog("pendings").fatal(error);
          result = {err:error,data:0};
     });

     nextFunction(result);
}

lightSensConfig.setSensConfig = async (moduleCode,sensor,treshold,edge,filter,statusActive) => {//treshold is float
     const mainQuery = `INSERT INTO ligth_sens_config 
                  SET moduleCode=${moduleCode},sensor=${sensor},treshold=${treshold},
                  edge=${edge},filter=${filter},statusActive=${statusActive}`;
                  
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
          logger.setLog("pendings").fatal(error);
          result = {err:error,data:0};
     });
     return result;
}

lightSensConfig.updateModuleSettings = async (deviceId,modulePos,address,enable) => {}

module.exports = lightSensConfig;