const sql = require("../../Data_Base/db.connection");
const logger = require('../../Auxiliary_Classes/logger');

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

compressorSettings.getBasic = async (deviceId) => {
     let mainQuery = `SELECT control_comp_slots.slot,daysArray,startHour,startMin,endHour,endMin `+
     `FROM control_comp_slots `+
     `LEFT JOIN control_comp_main `+
     `ON control_comp_slots.deviceId = control_comp_main.deviceId AND control_comp_slots.slot = control_comp_main.slot `+
     `WHERE control_comp_slots.deviceId = ${deviceId} AND (available=0 AND ev=1) `+
     `ORDER BY control_comp_slots.slot`;

     let con = await sql.connect();

     await con.query(mainQuery).then( ([rows,fields]) => {// await this promise
      
          if (rows.length) {
               result = {err:null,data:rows};
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

compressorSettings.getComplex = async (deviceId) => {
     let mainQuery = `SELECT control_comp_slots.slot,opReported,control_comp_slots.deviceId,daysArray,startHour,startMin,endHour,endMin,eventTitle,user.userId,user.name,user.email `+
     `FROM control_comp_slots `+
     `LEFT JOIN control_comp_main `+
     `ON control_comp_slots.deviceId = control_comp_main.deviceId AND control_comp_slots.slot = control_comp_main.slot `+
     `RIGHT JOIN live_event_subscribers `+
     `ON live_event_subscribers.deviceId = control_comp_main.deviceId AND live_event_subscribers.liveEventId = 23 `+
     `RIGHT JOIN user `+
     `ON user.userId = live_event_subscribers.userId `+
     `WHERE control_comp_slots.deviceId = ${deviceId} AND (available=0 AND ev=1) `+
     `ORDER BY control_comp_slots.slot `;

     let con = await sql.connect();

     await con.query(mainQuery).then( ([rows,fields]) => {// await this promise
      
          if (rows.length) {
               result = {err:null,data:rows};
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

compressorSettings.setOpReported = async (deviceId,slot,status) => {
     const mainQuery =`UPDATE control_comp_slots
                     SET opReported=${status}
                     WHERE deviceId=${deviceId} AND slot=${slot}`;

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



