const sql = require("../../models/db.connection");
const logger = require('../../debugg/logger');

/**
 * @brief
 *  CLASS
 *  Query the values related to control compressor
 *  
 */
const compressorSettings = {};

compressorSettings.getMain = async (deviceId,pendingOnly) => {
     let mainQuery = `SELECT control_comp_slots.slot,available,pendingUpdate,deleteReq,
     daysArray,powerCheck,startHour,startMin,endHour,endMin,controlID,ev
     FROM control_comp_slots
     LEFT JOIN control_comp_main
     ON control_comp_slots.deviceId = control_comp_main.deviceId AND control_comp_slots.slot = control_comp_main.slot
     WHERE control_comp_slots.deviceId = ${deviceId} AND available=0
     ORDER BY control_comp_slots.slot`;

     if(pendingOnly){
          mainQuery = `SELECT control_comp_slots.slot,available,pendingUpdate,deleteReq,
          daysArray,powerCheck,startHour,startMin,endHour,endMin,controlID,ev
          FROM control_comp_slots
          LEFT JOIN control_comp_main
          ON control_comp_slots.deviceId = control_comp_main.deviceId AND control_comp_slots.slot = control_comp_main.slot
          WHERE control_comp_slots.deviceId = ${deviceId} AND (control_comp_slots.available=0 AND control_comp_slots.pendingUpdate = 1)
          ORDER BY control_comp_slots.slot`;
     }

     let con = await sql.connect();

     await con.query(mainQuery).then( ([rows,fields]) => {// await this promise
      
          if (rows.length) {
               result = {err:null,data:rows};
               //console.table(rows);
          }else{
               result = {err:null,data:false};
               console.log("control compressor settings :: zero rows");
          }    
         
          con.end();
     })
     .catch((error)=>{//handle error
     logger.setLog("query").fatal(error);
     result = {err:error,data:null};
     });

     return result;
}

compressorSettings.getPcheck = async (deviceId) => {
     let mainQuery = `SELECT slot,ON_N,ON_E,timeout,incremental
     FROM control_comp_Pcheck
     WHERE deviceId =  ${deviceId}
     ORDER BY slot`;

     let con = await sql.connect();

     await con.query(mainQuery).then( ([rows,fields]) => {// await this promise
      
          if (rows.length) {
               result = {err:null,data:rows};
               //console.table(rows);
          }else{
               result = {err:null,data:false};
               console.log("control compressor settings :: zero rows");
          }    
         
          con.end();
     })
     .catch((error)=>{//handle error
          logger.setLog("query").fatal(error);
          result = {err:error,data:null};
     });

     return result;
}

compressorSettings.setUpdated = async (deviceId,slot) => {
     const mainQuery =`UPDATE control_comp_slots
                     SET pendingUpdate=0 
                     WHERE deviceId=${deviceId} AND slot=${slot}`;

     let con = await sql.connect();

     await con.query( mainQuery).then( ([rows,fields]) => {// await this promise
          console.log("set update control_comp_slots updatePending to false on slot : ",slot);
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

compressorSettings.setAll4Update = async (deviceId) => {
     const mainQuery =`UPDATE control_comp_slots
                     SET pendingUpdate=1 
                     WHERE deviceId=${deviceId} AND available=0`;

     let con = await sql.connect();

     await con.query( mainQuery).then( ([rows,fields]) => {// await this promise
          console.log("set update control_comp_slots affected: ",rows.affectedRows);
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

compressorSettings.setDeleteReq = async (deviceId) => {
     const mainQuery =`UPDATE control_comp_slots
                     SET deleteReq=0 
                     WHERE deviceId=${deviceId}`;

     let con = await sql.connect();

     await con.query( mainQuery).then( ([rows,fields]) => {// await this promise
          console.log("set false in deleteReq control_comp_slots affected: ",rows.affectedRows);
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

compressorSettings.findDeleteSlot=async (deviceId) => {
     let mainQuery =`SELECT slot,available FROM control_comp_slots WHERE deviceId ='${deviceId}' AND deleteReq =1`;
     let con = await sql.connect();

     await con.query(mainQuery).then( ([rows,fields]) => {// await this promise
      
          if (rows.length) {
               result = {err:null,data:rows};
               //console.table(rows);
          }else{
               result = {err:null,data:false};
               console.log("control compressor to delete :: zero rows");
          }    
         
          con.end();
     })
     .catch((error)=>{//handle error
     logger.setLog("query").fatal(error);
     result = {err:error,data:null};
     });

     return result;
}


compressorSettings.setSlot = async(deviceId,params) => {
     let mainQuery =`INSERT INTO control_comp_slots `+
     `SET deviceId='${deviceId}',slot='${params.slot}',available='${params.available}',`+
     `pendingUpdate='${params.pendingUpdate}' ON DUPLICATE KEY UPDATE deviceId='${deviceId}'`;

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

compressorSettings.setMain = async(deviceId,params) => {
     let mainQuery =`INSERT INTO control_comp_main `+
     `SET deviceId='${deviceId}',powerCheck='${params.powerCheck}',slot='${params.slot}',daysArray='${params.daysArray}',`+
     `startHour='${params.startHour}',startMin='${params.startMin}',endHour='${params.endHour}',endMin='${params.endMin}',`+
     `controlID='${params.controlID}',ev='${params.ev}',eventTitle='${params.eventTitle}' ON DUPLICATE KEY UPDATE deviceId='${deviceId}'`;
    
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

compressorSettings.setPcheck = async(deviceId,params) => {
     let mainQuery =`INSERT INTO control_comp_Pcheck `+
     `SET deviceId='${deviceId}',slot='${params.slot}',ON_E='${params.ON_E}',  `+
     `incremental='${params.incremental}' ON DUPLICATE KEY UPDATE deviceId='${deviceId}'`;
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

module.exports = compressorSettings;



