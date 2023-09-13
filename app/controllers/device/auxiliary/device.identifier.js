const sql = require("../../../models/db.connection");
const logger = require('../../../debugg/logger');
const device = require('../../../models/devices/devices');
const states = require('../../../module/states.machine.client');
const lastseenHandler = require('./lastseen.handler');

const deviceIndetifier = {};


deviceIndetifier.validatebyMac = async(mac) => {//ADD KEY TO VALIDATE
     console.log("device identifier :: POST by device, identifying ID");

     let result = await queryDevice(mac,false);
     return {error:result.error,success:result.success};
}

deviceIndetifier.validate = async(mac,bssid) => {
     console.log("device identifier :: Got a POST, identifying...");

     let result = await queryDevice(mac,bssid);
    
     return {error:result.error,success:result.success};
}

async function queryDevice(mac,bssid){
     let  deviceInfo=null;

     deviceInfo = await device.getbyMAC(mac);

     if(gotSomething(deviceInfo)){

          if(deviceInfo.data){//if we got Mac match
               //proceed to validate the KEY
               
               //set last seen of the device
               await lastseenHandler.set(deviceInfo.data[0].deviceId);

               logger.setLog('server').info(`device identifier :: POST by Device ID: ${deviceInfo.data[0].deviceId}.`);

               return {
                         error:null,
                         success:{
                              next:states.RECOGNITION.SUCCESSFULL,
                              data:deviceInfo.data
                         }
                    };
          }else{//false when we have no matches, proceed to check BSSID for a match
               
               deviceInfo=null;//reset variable
               logger.setLog('server').info("device identifier :: No Mac Found, checking BSSID...");

               if(bssid!=null && bssid!=undefined ){
                    deviceInfo = await device.getbyEmptyMac(bssid);

                    if(gotSomething(deviceInfo)){
                         //proceed to REGISTER device

                         if(deviceInfo.data.length){//if rows>0 , register the new device
                              
                              //set last seen of the device
                              await lastseenHandler.set(deviceInfo.data[0].deviceId);

                              logger.setLog('server').info(`device identifier :: Free device profile slot found related to id:${deviceInfo.data[0].deviceId}.`);
                              
                              return {
                                   error:null, 
                                   success: {
                                        next : states.RECOGNITION.NEW_REG, 
                                        data: deviceInfo.data
                                    }
                               };

                         }
                    }
               }

               logger.setLog('server').error("MAC and BSSID No matches found 401");
               return {error:states.ERROR._401, success:null};
          }
     }
   

     logger.setLog('server').fatal(deviceInfo.err);
     return {error:states.ERROR._500,success:null};// 500 : server logic error     
}

function gotSomething(data){
     if(data!=null){
          if(data.err==null){
               return true;
          }
     }
     return false;
}

module.exports = deviceIndetifier;