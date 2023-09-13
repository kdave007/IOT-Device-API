const logger = require('../../debugg/logger');
const states = require('../../module/states.machine.client');
const scout = require('./auxiliary/device.identifier');
const sql = require('../../models/db.connection');
const otaLog = require('./auxiliary/ota.logger');
const OTA_BY_DEFAULT = 2;
const otaProv = {};

otaProv.get = async (params,res) => {
     let logString ="";
     const ip ="69";
     let st = 401;
     if(params.mac){
          let result = await scout.validatebyMac(params.mac);
          if(result.error==null){
               let OTAinfo = await getOTASettings(result,params);

               const device = result.success.data[0].deviceId;
               
               if(queryGotSomething(OTAinfo)){
                  
                    logger.setLog("query").info("OTA provider :: sending OTA bin");
                    
                    //await setEnable(device,0);
                    logString = `Update requested, file ${OTAinfo.data.filename} delivered`;
                    await otaLog.insertRow(device,logString,ip);

                    res.set('x-Sha256',OTAinfo.data.elfSha256);
                    res.download(`./bin/${OTAinfo.data.filename}`,false);
                    return;
               }
               //await setEnable(device,0);
               st = OTAinfo.err;

               logString = `Update requested, no update required`;
               await otaLog.insertRow(device,logString,ip);
          }
     }else{

          logger.setLog("query").info("OTA provider :: UNAUTHORIZED mac");
     }

     res.set('Content-Length', 0);
     res.status(st).end();
     return;
}

otaProv.setNew = async (deviceId,otaID) => {// EXPORT SET FUNCTION
     otaTestingID =  OTA_BY_DEFAULT;
     otaID = otaTestingID;//DELETE LATER
     const mainQuery = `INSERT INTO ota_device (deviceID, otaEnable, otaID) 
                        VALUES (${deviceId}, 1, ${otaID}) 
                        ON DUPLICATE KEY UPDATE deviceID=deviceID`;
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

async function getOTASettings(references,params){
     const state = references.success.next;
     const device = references.success.data[0].deviceId;

     if( state == states.RECOGNITION.SUCCESSFULL){
          
          let OTAparams = await queryOTA(params.mac);

          if(OTAparams.err==null){
              let update = updateCheck(params.version,OTAparams.data);//check if we can or must update
              
              if(update.next){
                    
               return {err: null ,data: OTAparams.data};
              }
     
              return {err: update.status ,data: null};
          }
     }

     return {err:401,data:null};//UNAUTHORIZED
}

function updateCheck(deviceVersion,OTAparams){

     if(!OTAparams.otaForce){
          console.log("ota force is disabled");
          if(OTAparams.otaEnable){

               if(deviceVersion && OTAparams.version){

                    if(deviceVersion.localeCompare(OTAparams.version)){
                        
                         logger.setLog("server").info(`OTA provider :: requested OTA, found new version.`);
                         //UPDATE RQUESTED, SENDING OTA [LOG]
                         return {status: 200, next:true};
                    }else{
                         //BOTH VERSIONS ARE EQUAL
                         logger.setLog("server").info(`OTA provider :: requested OTA, update is not required.`);
                    }
               }
          }else{
               logger.setLog("server").info(`OTA provider :: OTA request disabled.`);
          }
          
          return {status: 204, next:false};
     }else{
          //UPDATE RQUESTED, SENDING OTA [LOG]
          logger.setLog("server").info(`OTA provider :: requested OTA by Force.`);
          otaProv.resetForce(OTAparams.deviceID);

          return {status: 200, next:true};
     }
}

function queryGotSomething(row){
     if(row.err == null){
          if(row.data){
               return true;
          }
     }

     return false;
}

//QUERY FUNCTIONS :
async function setEnable(deviceId,enable){

     const mainQuery = `UPDATE ota_device  
                        SET otaEnable=${enable}
                        WHERE deviceID=${deviceId}`;
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

otaProv.resetForce = async (deviceId) => {// WHEN OTA FORCE , USE THIS TO RESET
     const mainQuery = `UPDATE ota_device  
                        SET otaForce=0
                        WHERE deviceID=${deviceId}`;
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

async function queryOTAConfig(){
     const mainQuery = ` SELECT alias,value FROM ota_global_config`;

     let con = await sql.connect();
     await con.query( mainQuery).then( ([rows,fields]) => {// await this promise
          if (rows.length) {
               result = {err:null,data:rows[0]};
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

async function queryOTA(mac){
     const mainQuery = `SELECT ota_device.deviceID, ota_device.otaEnable, ota_list.filename, ota_list.elfSha256, ota_device.otaForce, ota_list.version 
            FROM atechnik_hTelemetry.ota_device
            LEFT JOIN device ON ota_device.deviceID = device.DeviceID
            LEFT JOIN ota_list ON ota_list.otaID = ota_device.otaID
            WHERE device.mac = '${mac}'`;

     let con = await sql.connect();
     await con.query( mainQuery).then( ([rows,fields]) => {// await this promise
          if (rows.length) {
               result = {err:null,data:rows[0]};
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

module.exports = otaProv;