const scout = require('./auxiliary/device.identifier');
const logger = require('../../debugg/logger');
const states = require('../../module/states.machine.client');
const insertHandler = require('../device/auxiliary/samp.insert.controller');
const advancedConfig = require('../../models/devices/advanced.config');
const backDoor = true;

exports.parser = async (params,samples,res) => {
     let st = 401;//unauthorized credentials
     let completedTask = false
     if(params.mac){
          let result = await scout.validatebyMac(params.mac);
          if(result.error==null){
               completedTask = await validatePass(result.success.data[0].deviceId,params.key);
               console.log("key validation succes :",completedTask)
               if(backDoor){
                    completedTask=true;
               }
               if(completedTask){
                    // logger.setLog('testing').dateMx("Post received.");
                    checkObject(samples,result.success.data[0].deviceId,params.key);//checks if the samples object is empty

                    let inRes = await parseData(result,samples);
                    if(inRes.error==null){
                         st = 200;//INSERTED ALL
                    }else{
                         st = inRes.error;
                    }
               }
          }else{
               st = result.error;
          }
     }
     res.set('Content-Length', 0);
     res.status(st).end();
     return; 
} 

async function parseData(result,samples){
     let error=404;
     let success=false;
     const sampKeys = states.SAMPLES_KEYS;

     const state = result.success.next;
     const device = result.success.data[0].deviceId;

     console.log("Samples ",samples);
     
     if(samples["TH-TV"]!=undefined){
          console.log("sample array ");
          for(let i = 0; i < samples["TH-TV"].length; i++){
               console.log(samples["TH-TV"][i]);
          }
     }
     logger.setLog('testing').testing(samples);// TESTING ONLY <----------------------------------

     if( state == states.RECOGNITION.SUCCESSFULL){
          if(samples){

               try{
                    const keys = Object.keys(sampKeys);

                    for(let i=0;i<keys.length;i++){
                         let index = sampKeys[keys[i]];

                         if( comprobeSamples(samples[index]) ){
                             let result = await rowInsertion(device,samples[index],index);
                            
                         }
                    }
                    

               }catch(e){
                    logger.setLog('server').fatal(e);
               }

          }
     }
     if(result.error==null){
          success=true;
     }else{

     }

     return {error:result.error,success:success}
};

function comprobeSamples(samp){
     if(samp!=undefined){
          
          return true;
     }

     return false;
}

async function rowInsertion(deviceId,sampObj,index){
     const sampKeys = states.SAMPLES_KEYS;
     let rowsInserted = 0;
     let string=null;

     switch (index){
          case sampKeys.L_MODULE:
               console.log(`INSERT ${index}`);
               rowsInserted = await insertHandler.lightMod(deviceId,sampObj);
               title = "Light M";
          break;
          case sampKeys.GPS:
               console.log(`INSERT ${index}`);
               rowsInserted = await insertHandler.gps(deviceId,sampObj);
               title = "GPS";
          break;
          case sampKeys.GPIO:
               console.log(`INSERT ${index}`);
               rowsInserted = await insertHandler.gpio(deviceId,sampObj);
               title = "GPIOs";
          break;
          case sampKeys.TH_TV:
               console.log(`INSERT ${index}`);
               rowsInserted = await insertHandler.tempsnVoltage(deviceId,sampObj);
               title = "Temps";
          break;
          case sampKeys.EVENT:
               console.log(`INSERT ${index}`);
               rowsInserted = await insertHandler.event(deviceId,sampObj); 
               string = eventsCount(rowsInserted.extraParams);
          break;
          case sampKeys.PR_V:
               console.log(`INSERT ${index}`);
               rowsInserted = await insertHandler.powerBank(deviceId,sampObj);
               title = "Pow Bank";
          break;
     }
     
     if(rowsInserted.error==null){
          
          string = (string==null) ? rowsInserted.rows+" "+title+" inserted" : string;
          console.log(`data received :: ${string}`);
          await insertHandler.serverLog(deviceId,string);
          
          return {error:null,success:true};
     }

     string = "JSON ERROR ENCODE on "+title+"("+rowsInserted.rows+")";
     logger.setLog('server').info(`data received :: ${string}`);
     await insertHandler.serverLog(deviceId,string);
     

     return {error:200, success:false};//200 but it is a 404 actually
}

function eventsCount(params){
     return `${params.live} live, ${params.normal} normal events inserted`;  
}

async function validatePass(device,refKey){
    
     let access = await advancedConfig.getKey(device);

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

function queryGotSomething(data){

     if(data.err==null){
          if(data.data){
               return true;
          }
     }

     return false;
}

function checkObject(target,device){
     try{
          if(target.constructor === Object){//TO DO add complementary object emptiness comprobation ***************
               return;
          }
          logger.setLog('server').info('[LOG]Samples object is empty (device id is '+device+'): '+target);
     }catch(e){
          logger.setLog('server').info("[LOG] there was an error checking the samples object : "+e+" ==>");
          logger.setLog('server').info(target);
     }
     
}