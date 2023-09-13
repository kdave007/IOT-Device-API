const sql = require("../../models/db.connection");
const logger = require('../../debugg/logger');
const wifiOptions = require('../devices/wifi.utils');

/**
 * @brief
 *  CLASS
 *  Query the values of device configuration:
 *  
 *  Thermistors calibration (temp offsets)
 *  Gpio's Filters (Millis)
 *  Schedule report type (HOURS=0,INT=1)
 *  LTE enables to send report by LTE
 *  GPS enables to send the actual location of the device
 *  SAMP-T sample time in minutes
 *  SAMP-N max number of average samples taken by thermistors
 */

 const configProvider = {};

 configProvider.getConfigUpdate = async (deviceId) => {
      const mainQuery = `SELECT device_config_list.configId,device_config.value,device_config.pending,device_config_list.alias
      FROM device_config_list
      LEFT JOIN device_config
      ON device_config_list.configId = device_config.configId
      WHERE deviceId=${deviceId} 
      ORDER BY device_config_list.configId`;
     
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

configProvider.getWIFI = async (deviceId,op) => {
     var mainQuery = null;

     switch (op){
          case wifiOptions.QUERY.UPDATE:
               mainQuery = `SELECT apId,priority,enable,ssid,psw as 'key',pending,deleteReq,bssid
               FROM device_ap 
               WHERE deviceId=${deviceId} AND pending=1`;
          break;
          case wifiOptions.QUERY.ALL:
               mainQuery = `SELECT apId,priority,enable,ssid,psw as 'key',pending,deleteReq,bssid
               FROM device_ap 
               WHERE deviceId=${deviceId} `;
          break;
          default:

          break;
     }
     //console.log(mainQuery)
     let con = await sql.connect();
     await con.query( mainQuery).then( ([rows,fields]) => {// await this promise
     
         if (rows.length) {
              result = {err:null,data:rows};
              //console.table(rows);
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

configProvider.getWIFI4Delete = async (deviceId) => {
     let mainQuery = `SELECT apId
               FROM device_ap 
               WHERE deviceId=${deviceId} AND deleteReq=1`;
     let con = await sql.connect();
     await con.query( mainQuery).then( ([rows,fields]) => {// await this promise

          if (rows.length) {
               result = {err:null,data:rows};
               //console.table(rows);
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


/**
 * @brief
 * After WIFI changes sent to device to update values
 * set the penging flag value back to 0, cause the
 * device has acknowledge the update value.
 */
configProvider.setAckWIFI = async (deviceId) => {
     
     const mainQuery =`UPDATE device_ap 
                       SET pending=0 
                       WHERE deviceId=${deviceId} AND pending=1`;

     let con = await sql.connect();

     await con.query( mainQuery).then( ([rows,fields]) => {// await this promise
     console.log("setACK WIFI rows affected: ",rows.affectedRows);
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

/**
 * @brief
 * After config changes sent to device to update values
 * set the penging flag value back to 0, cause the
 * device has acknowledge the update value.
 */
configProvider.setDeleteReq = async (deviceId) => {
     const mainQuery =`UPDATE device_ap 
                       SET deleteReq=0 
                       WHERE deviceId=${deviceId} AND deleteReq=1`;

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

/**
 * @brief
 * After WIFI delete request sent to device to delete values,
 * delete values in the DB as well.
 */
configProvider.setAckConfig = async (deviceId) => {
     const mainQuery =`UPDATE device_config 
                       SET pending=0 
                       WHERE deviceId=${deviceId} AND pending=1`;

     let con = await sql.connect();

     await con.query( mainQuery).then( ([rows,fields]) => {// await this promise
     console.log("setACK device_Config rows affected: ",rows.affectedRows);
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


configProvider.inDefaultRow = async (deviceId,configId,value,pending) => {
     value = (configId==1 || configId==2) ? "'"+value+"'" : value;//prepare if string is needed

     var mainQuery = `INSERT INTO device_config 
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


module.exports = configProvider;


