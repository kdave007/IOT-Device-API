const scout = require('./auxiliary/device.identifier');
const logger = require('../../debugg/logger');
const states = require('../../module/states.machine.client');
const advancedConfig = require('../../models/devices/advanced.config');
const WifiConfig = require('../../models/devices/devices.configA');
const wifiOptions = require('../../models/devices/wifi.utils');
const device = require('../../models/devices/devices');
const users = require('../../models/authentication.model');
const crypto = require('crypto');
const configs = require('./auxiliary/get.configs');
const config = require('./auxiliary/query.config');
const statusCheck = require('./auxiliary/status.check');
const pendingPackage = require('../../models/devices/pendingPackage');
const resetDevice = require('../../models/devices/reset.pending');
const OTA = require('./ota.provider');
const serverLog = require('../../models/samples/insert_samples/server.log');
const referenceDate = require('../../models/samples/insert_samples/referenceDate');

const backDoor = true;//SET TRUE ONLY IN TESTING MODE, AFTER TESTS, SET BACK TO FALSE : IMPORTANT!!

exports.getUpdate = async(params,res) => {
     console.log("1 validation ",params.bssid,params.mac)
     if(params.mac!=null && params.mac!=undefined){
          if(params.bssid!=null && params.bssid!=undefined){
               console.log("bssid validation ",params.bssid)
               let status = await scout.validate(params.mac,params.bssid);
               taskSelector(status,params.mac,params.key,res,params.configs,params.version,params.refDay,params.refEPOCH);
          }else{
               console.log("mac validation ",params.bssid,params.mac)
               let status = await scout.validatebyMac(params.mac);
               taskSelector(status,params.mac,params.key,res,params.configs,params.version,params.refDay,params.refEPOCH);
          }
     }
}

async function taskSelector(status,mac,refKey,res,gotConfigs,apiVer,day,EPOCH){
     let errorST = 500;
     let completedTask = false;
     let finalTask=false;
     let getALL = false;
     
     if(gotData(status)){
          let deviceId = status.success.data[0].deviceId;
          logger.setLog('server').info('[LOG] /// device ID '+deviceId);          

          await referenceDate.insertRow(deviceId,day,EPOCH);

          switch (status.success.next){
               case states.RECOGNITION.NEW_REG:
                    await pendingPackage.update(deviceId,1);
                    console.log("register new device to: ",status.success.data);
                    completedTask = await registerNew(deviceId,mac,apiVer);
                    //await resetDevice.insert(deviceId);//insert pending as 0

                    finalTask = states.TASK.NEW_DEF;
                    errorST=500;
               break;
               case states.RECOGNITION.SUCCESSFULL:
                    completedTask = await validatePass(status,refKey);
                    console.log("validate key result",completedTask)
                    finalTask = states.TASK.GET_UPDT;
                    checkReset = true;

                    if(gotConfigs){//if is the second round to ask the second package, check this flag
                         getALL = (gotConfigs.localeCompare("ERR")) ? false : true;//if strings equal returns a false, then set -> true
                    }

                    errorST=401;
               break;
               default:
                    logger.setLog("server").error("STATES MACHINE RECOGNITION ERROR COMMAND: ",status.success.next);
               break;
          }

          if(completedTask){
               await finalMission(deviceId,finalTask,res,getALL);               
          }else{
               res.status(errorST).end();
          }

     }else{
          logger.setLog("server").error("config response :: no data found ");
          res.status(status.error).end();
     }
     logger.setLog('server').info("config response :: Finished device on POST Thread");//FINISH
}

function gotData(status){//check if there is an error

     if(status.error==null){
          return true;
     }
     return false;
}

function queryGotSomething(data){

     if(data.err==null){
          if(data.data){
               return true;
          }
     }

     return false;
}

async function registerNew(devId,newMac,apiVer){
     logger.setLog('query').info(`config response :: Registration service process starting...`);
     let wifiC = await WifiConfig.getWIFI(devId,wifiOptions.QUERY.ALL);
     
     if(queryGotSomething(wifiC)){//check if we have at least one wifi AP saved, if not, cannot register the device 
        
          let result = await device.updateMac(devId,newMac,apiVer);// returns back in .data the affected rows lenght, 0 is false
          await device.setLastSeen(devId);

          if(queryGotSomething(result)){

               if(result.data){//affected a row ?
                    logger.setLog('query').info(`config response :: New device registration, associated to id: ${devId} with mac: ${newMac}`);

                    await keyGenerator().then( async (token) =>{
          
                         if(!token){
                              token = "1q2w3e4r5t6y_" 
                              logger.setLog('server').error(`config response :: A default KEY was given, please update deviceId:${devId} KEY manually.`);
                              logger.setLog('pendings').error(`config response :: A default KEY was given, please update deviceId:${devId} KEY manually.`); 
                         }
                         
                         let insertedKey = await advancedConfig.setKey(devId,token);//set new token key, returns number of rows affected

                         if(insertedKey.err!=null){
                                   logger.setLog('server').error(`config response :: INSERT key registration failed, deviceId:${devId}`);
                                   logger.setLog('pendings').error(`config response :: INSERT key registration failed, deviceId:${devId}`);
                         }
                    });
                    let otaId = 6;// release OTA version 
                    await OTA.setNew(devId,otaId);//Set new OTA config for the new registered DEVICE

                    let adminsIDs = await users.getAdminsIDs();

                    if(adminsIDs.err==null && adminsIDs.data){
                         for(let i = 0; i<adminsIDs.data.lenght ; i++){
                              await device.assignToUser(adminsIDs.data[i].userId,devId);
                         }
                    }

                    let logTxt =`New Device Registered`;
                    await serverLog.insertRow(devId,logTxt);

                    logger.setLog('server').info(`config response :: New device registration process finished, id:${devId}`);
                    
                    return true;  
               }
          }

     }    
          let logTxt =`Couldn't register device`;
          await serverLog.insertRow(devId,logTxt);
          logger.setLog('query').error(`config response :: Cannot register, there are no wifi profiles assigned to id: ${devId}, please add at least one wifi Ap to this device id.`);
          return false;
}

async function validatePass(status,refKey){
    
     let access = await advancedConfig.getKey(status.success.data[0].deviceId);

     if(queryGotSomething(access)){
          console.log("access key (ABOVE)");
          if(backDoor){
               console.log("[IMPORTANT!!] backdoor for TESTING is open, please close it when TESTS are finished.");
               return true;
          }else{
               if(access.data[0].value.localeCompare(refKey)==0){// 0 means they are equal strings
                    
                    return true;
               }
          }
     }

     logger.setLog('server').info("config response :: key validation rejected");
     return false;
}

function keyGenerator(){
     return new Promise((resolve, reject) => { 
          
          crypto.randomBytes(15, async function(err, buffer) {
          if(err==null){
               let token =  buffer.toString('hex');

               resolve(token);
               return;
          }
          console.log(err);
          logger.setLog('server').fatal('config response :: error generating KEY');
          
          reject(false);
        });

     });
    
}


async function finalMission(id,nextTask,res,getALL){
     let result = null;
     let finalACK = nextTask;
     if(!getALL){
          console.log('config response :: query only updates required');
          //result = await configs.get(id,nextTask);
          result = await config.get(id,nextTask);
     }else{
          console.log("config response :: query all config's");
          //result = await configs.getAll(id);
          result = await config.get(id,states.TASK.GET_ALL);
          finalACK = states.TASK.GET_ALL;
          
     }

     if(result.error==null){

          if(!result.continueTask){
               res.set('Content-Length', 0);
               res.status(204).end();
               return;
          }
          
          await config.whenSending(result,id,finalACK);
          
          if(!result.data){
               let st = (finalACK == states.TASK.GET_ALL) ? result.status : 204;
               res.set('Content-Length', 0);
               res.status(st).end();
               return ;
          }
          
          //res.send(dataReady.package).end();//this must be at the very end
         console.log("*********************************************",result.data);
          res.status(result.status);
          res.send(result.data);
          return ;
     }
     
     console.log("No configurations to update");
     res.set('Content-Length', 0);
     res.status(result.error).end();//if we dont have wifi configs, end it with a 204

     return false;
}

// async function finalReset(res,id){

//      await resetDevice.setPending(id,0);
     
//      res.status(205).end();
// }