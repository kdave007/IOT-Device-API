const logger = require('../Auxiliary_Classes/logger');
const sensorController = require('./Controllers/light.samples.controller');
const devices = require('../Query_Classes/Device_Settings/devices.model');

exports.watchdogRoutine = async() => {
     let devicesList = await findDevices();
     if(devicesList){
          let felonies = await validateSamples(devicesList);
          return felonies;
     }
     return false;
}

async function findDevices(){
     let devicesList = await devices.getActive();
     
     if(devicesList.err == null){
          return devicesList.data;
     }
     logger.setLog("server").error("light sensor alerts :: couldn't get devices");
     return false;
}

async function validateSamples(devicesList){
     let params = await sensorController.findAlertParams();
     
     if(params){    
          return await evaluateSamples(devicesList,params);
     }
     return false;
}

async function evaluateSamples(devicesList,params){//<------ sensor definition pending
     const sensor = 3;//sensor logic or defined sensor?
     let range = await sensorController.findRange();
     console.log("range ",range)

     for(let index = 0; index<devicesList.length; index++){
          let reference = parseParams(devicesList[index].deviceId,params);
          
          if(reference){
               // found limits parameters for deviceID
               // console.log("check ",devicesList[index].deviceId)
               let samples = await sensorController.getSortedbyPeriods(devicesList[index].deviceId,sensor,range);
               if(samples){
                    let felonies = await sensorController.findFelonies(samples,reference,sensor);
                    return felonies;
               }
          }
     }
     return false;
}

function parseParams(deviceId,params){
     if(params){
          const index = params.findIndex(row => row.deviceId === deviceId);
          if(index > -1){
               let reference = {timeout : params[index].value, alertType: params[index].alertType}
               params.splice(index,1);
               return reference;
          }
     }
     return false;
}



