const logger = require('../../../debugg/logger');
const states = require('../../../module/states.machine.client');
const Device_config= require('../../../models/devices/devices.configA');
const advConfig = require('../../../models/devices/advanced.config');
const monitorConfig = require('../../../models/devices/truck.mon.config');
const lightConfig = require('../../../models/devices/light.sensors.config');
const liveEventConfig = require('../../../models/devices/live.event');
const wifiSettings = require('../wifi.valitadion');
const compSettings= require('../compressor.settings');
const devDefJSON = require('../../../models/devices/utils');
const defValues = require('../../../models/devices/default.DB'); 
const pendingPackage = require('../../../models/devices/pendingPackage');
const time = require('../../date.time');

exports.get = async(id,scenario) => {
     let result = await queryTask(id,scenario);
     return result;
}

exports.whenSending = async (settings,id,scenario) => {
     let params = getParams(settings,scenario);
     if(params.keys){
          await after(params,id,scenario);
     }  
}

function queryGotSomething(row){
     if(row.err==null){
          if(row.data){
               return true;
          }
     }
     return false;
}

async function queryTask(id,scenario){
     let settings = false;
     if(scenario ==  states.TASK.GET_ALL ){
          //check last type, and indetify the actual query, only when device want ALL settings
          let query = await nextQuery(id);
          if(!query.next){
               return {status: 204};
          } 
          settings = await querySelector(id,scenario,query);

     }else if(scenario ==  states.TASK.GET_UPDT){
          settings = await findUpdates(id,scenario);
          

     }else if(scenario ==  states.TASK.NEW_DEF){
          settings = await setDefault(id,scenario);
          
     }
 
     return settings;
}

async function findUpdates(id,scenario){
     let packageTypes = [
          devDefJSON.packageTypes.WIFI,
          devDefJSON.packageTypes.MISC,
          devDefJSON.packageTypes.COMP_CONTROL,
          devDefJSON.packageTypes.L_MOD
     ];
     let keepGoing = true;
     let settings = false;
     let status = 204;

     for(let i=0;i<packageTypes.length;i++){
         
          let query = {next:packageTypes[i]};
        
          if(keepGoing){
               settings = await querySelector(id,scenario,query);
               keepGoing = (!settings.data)? true : false;
               status = (settings.data)? 206 : status;
          }
          
     }
     
     return {data: settings.data ,afterSent: settings.afterSent ,status, continueTask:true};
}

async function setDefault(id,scenario){
     let packageTypes = [
          devDefJSON.packageTypes.WIFI,
          devDefJSON.packageTypes.MISC,
          devDefJSON.packageTypes.L_MOD
     ];

     let keepGoing = true;
     let settings = false;
     let status = 206;
     let wifiSettings = {data:null};

     for(let i=0;i<packageTypes.length;i++){
         
          let query = {next:packageTypes[i]};
        
          if(keepGoing){
               settings = await querySelector(id,scenario,query);
               if(packageTypes[i]==devDefJSON.packageTypes.WIFI){
                    wifiSettings = settings;
                    console.log(wifiSettings)
               }
               console.log("set default at ",query)
               keepGoing = (wifiSettings.data==null || wifiSettings.data==false)? false : true;
          }
     }

     if(wifiSettings.data==null || wifiSettings.data==false){//MO WIFI PROFILES FOUND, STOP
   
          return {data: false ,afterSent:false ,status:204, continueTask:false};
     }

     await pendingPackage.updateSlotsWaiting(id,0);// DELETE ALL CONFIGS AND RETRY AND SEE IF THIS ONE WORKS
    
     return {data: wifiSettings.data ,afterSent: settings.afterSent ,status:status, continueTask:true};  
}

async function nextQuery(id){//only used when the device ask for all the settings with "ERR"
     let next = false; let firstTime = false;
     let lastQuery = null;

     //query last package sent record, so we know where to start
     let lastPack = await pendingPackage.get(id);

     if(queryGotSomething(lastPack)){
          lastQuery = lastPack.data.value;
     }
     
     switch (lastQuery){
          case devDefJSON.packageTypes.WIFI :
               next = devDefJSON.packageTypes.MISC;
          break;    
          case devDefJSON.packageTypes.MISC :
               next = devDefJSON.packageTypes.COMP_CONTROL;
          break;
          case devDefJSON.packageTypes.COMP_CONTROL :
               //query pending slots
               let waitingLine = await pendingPackage.getSlotsWaiting(id);
               next = devDefJSON.packageTypes.L_MOD; 
               
               if(queryGotSomething(waitingLine)){//if there is more slots waiting to be send, keep looping until all sent
                    if(parseInt(waitingLine.data.value)){//this flag is a character, must parse to int
                         next = devDefJSON.packageTypes.COMP_CONTROL;
                    }
               }
          break;
          case devDefJSON.packageTypes.L_MOD :
               next = devDefJSON.packageTypes.WIFI;
          break;
          default:
               //insert or update deviceId,configId, value to: WIFI
               firstTime = devDefJSON.packageTypes.WIFI;
               next = devDefJSON.packageTypes.WIFI;
          break;
     }
     
     return {next:next, firstTime:firstTime};
}

async function querySelector(id,scenario,queryType){
     let status = 206;
     let result = false;
     let sorted = false;
     let continueTask = true;

     let afterSent = {};
    
     let next = queryType.next;

     //identify what settings to query
     switch (next){
          case devDefJSON.packageTypes.WIFI :
               console.log("query selector : ",next);
               let wifiArrays = await wifiSettings.getWifi(id,scenario);
               console.log("wifiArrays ",wifiArrays);
               result.data=false;
               if(wifiArrays.error==null){
                    result = wifiArrays;
                    
               }
               
          break;    
          case devDefJSON.packageTypes.MISC :
               console.log("query selector: ",next);
               console.log("MISC ",result);
               result = await joinMisc(id,scenario);
          break;
          case devDefJSON.packageTypes.COMP_CONTROL :
               console.log("query selector: ",next);
               result = await compControlQuery(id,scenario);
               afterSent["slotsToSend"]=result.slotsToSend;
               afterSent["waitingSlots"]=result.waitingSlots;
               afterSent["deleteReq"]=result.deleteReq;
          break;
          case devDefJSON.packageTypes.L_MOD :
               console.log("query selector: ",next);
               result = await queryLightSens(id,scenario);
          break;
     }

     if(result.err==null){ 
            
          sorted = result.data;
     }else{
          status = 500;
          sorted = false;
     }

     if(scenario==states.TASK.GET_ALL){
          afterSent["firstTimeGetAll"]= queryType.firstTime;

          if(next == devDefJSON.packageTypes.MISC ){
               //when Get All case & sending MISC, set pendingUpdate true to all compressor settings
               await compSettings.pendingUpdateALL(id);
          }
          if(next == devDefJSON.packageTypes.WIFI){//stop if we dont have WIFI profiles when GET ALL 
               continueTask = (sorted) ? true : false;
               status = (sorted) ? 206 : 204;
          }
          if(next == devDefJSON.packageTypes.L_MOD){//when sending L-MOD, last package
               status = 200;
          }
          if(next == devDefJSON.packageTypes.COMP_CONTROL){//when sending L-MOD, last package
               status = 206;
          }
     }
     console.log(sorted);
     console.log("status",status)
     return { afterSent: afterSent, status: status, data : sorted, continueTask: continueTask};
}

async function after(params,id,scenario){
    
     await setAck(id,params.keys,params.extraParams,scenario);
}

async function setAck(id,keys,extraParams,scenario){
     let title =false;
     for(let i=0;i<keys.length;i++){
          
          title = keys[i];

          switch (keys[i]){
               case states.SETTINGS.AV_CONFIG :
                         console.log(`acknowledge :: ${states.SETTINGS.AV_CONFIG}`);
                         await advConfig.setAck(id);
                         title = "MISC";
               break;
               case states.SETTINGS.REPORT :
                         console.log(`acknowledge :: ${states.SETTINGS.REPORT}`);
                         await Device_config.setAckConfig(id);
                         title = "MISC";
               break;
               case states.SETTINGS.SENS_FILTER :
                         console.log(`acknowledge :: ${states.SETTINGS.SENS_FILTER}`);
                         await Device_config.setAckConfig(id);
                         title = "MISC";
               break;
               case states.SETTINGS.THERM_CAL :
                         console.log(`acknowledge :: ${states.SETTINGS.THERM_CAL}`);
                         await Device_config.setAckConfig(id);
                         title = "MISC";
               break;
               case states.SETTINGS.LIGHT_MOD :
                         console.log(`acknowledge :: ${states.SETTINGS.LIGHT_MOD}`);
                         await lightConfig.setAck(id);
               break;
               case states.SETTINGS.LIVE_EVENT :
                         console.log(`acknowledge :: ${states.SETTINGS.LIVE_EVENT}`);
                         await liveEventConfig.setAck(id);
                         title = "MISC";
               break;
               case states.SETTINGS.MON_CONFIG :
                         console.log(`acknowledge :: ${states.SETTINGS.MON_CONFIG}`);
                         await monitorConfig.setAck(id);
                         title = "MISC";
               break;
               case states.SETTINGS.WIFI_CONFIG :
                         console.log(`acknowledge :: ${states.SETTINGS.WIFI_CONFIG}`);
                         await wifiSettings.deletenAck(id);
               break;
               case 'WIFI-ERASE' :
                         console.log(`acknowledge :: ${states.SETTINGS.WIFI_CONFIG}`);
                         await wifiSettings.deletenAck(id);
               break;
               case states.SETTINGS.COMP_CONTROL :
                         console.log(`acknowledge :: ${states.SETTINGS.COMP_CONTROL}`);
                        
                         if(extraParams){
                              let totalWaiting = (extraParams.waitingSlots) ?  extraParams.waitingSlots : 0;
                              await pendingPackage.updateSlotsWaiting(id,totalWaiting);
                              if(extraParams.slotsToSend) {
                                   await compSettings.updatedAck(id,extraParams.slotsToSend);
                              }
                              if(extraParams.deleteReq) {
                                   await compSettings.deleteAck(id);
                              }
                         }
               break;
          } 
     }

     if(scenario == states.TASK.GET_ALL || scenario == states.TASK.NEW_DEF){
          if(title){
               await pendingPackage.update(id,title);
          }
     }

    return;
}

function getParams(settings,scenario){
     let extraParams = false;
     let keys = []
     let specialKey = specialScenario(settings,scenario);

     if(!specialKey){

          if(settings.data){
               keys = Object.keys(settings.data);

               if(keys[0] == devDefJSON.packageTypes.COMP_CONTROL){
                    //if we found the C-CONTROL key, special case
                    extraParams = whenCompressorKey(settings);
               }
          }
     }else{
          keys=[specialKey];
          extraParams = whenCompressorKey(settings);
     }
     
     return {keys: (keys.length) ? keys : false ,extraParams: extraParams};
}

function whenCompressorKey(settings){
     let extraParams = {waitingSlots: false,slotsToSend: false,deleteReq:false};
     if(settings.afterSent.waitingSlots){
          extraParams.waitingSlots = settings.afterSent.waitingSlots.length;
     }

     if(settings.afterSent.slotsToSend){
          extraParams.slotsToSend = settings.afterSent.slotsToSend;
     }

     if(settings.afterSent.deleteReq){
          extraParams.deleteReq = settings.afterSent.deleteReq;
     }
     return extraParams;
}

function specialScenario(settings,scenario){
     if(scenario==states.TASK.GET_ALL){
          if(settings.afterSent.waitingSlots!=undefined){
               if(settings.data==false){
                    return devDefJSON.packageTypes.COMP_CONTROL;
               }
          }
     }
     return false;
}


/**
 * @brief
 * MISC Methods:
*/
//////////////////////////////////
///   MISC General  method    ///
////////////////////////////////

async function joinMisc(id,scenario){
     let result = [];
     let packageToSend = {};
     let key = false;

     let dev_config = await device_config(id,scenario);
     let adv_config = await queryAdvanced(id,scenario);
     let monitor_config = await queryMonitor(id,scenario);
     let live_config = await queryLive(id,scenario);

     result.push(adv_config.data);
     result.push(monitor_config.data);
     result.push(live_config.data);

     if(dev_config.data){
          for(let i=0;i<dev_config.data.length;i++){
               key = Object.keys(dev_config.data[i])+"";
               packageToSend[key] = dev_config.data[i][key];
          }
     }
     
     result.forEach( (value) =>{
          if(value){
               key = Object.keys(value)+"";
               packageToSend[key] = value[key];
          }    
     });
     let gotSomething = Object.keys(packageToSend).length;

     return {err : null, data: (gotSomething) ? packageToSend : false};
}

////////////////////////////////
///   device config query   ///
//////////////////////////////

async function device_config(id,scenario) {//query device_config values
     var data = false;
     let devConf = await Device_config.getConfigUpdate(id);
     
     if(queryGotSomething(devConf)){
           if(scenario==states.TASK.GET_ALL){//if is a get All no matter what scenario, then...
               data = dev_configSort(devConf.data,true);
           }else{
               data = dev_configSort(devConf.data,false);// the second arg sets if you want to get all configs no matter pending flag status
           }

           if(data){
               console.log("get config's :: device_config for update.");
           }else{
               console.log("get config's :: No device_config updates required.");
           }
          
     }else{

          if(devConf.err){//If there was a en error in the query above, send error for a retry
               logger.setLog('server').error('get configs :: error while querying configs Update');
              
               return {error:500, data:null};//SEND ERROR FOR A DEVICE POST RETRY
          }
          //this is only if we didn't get data from the first device config query:
          switch (scenario) {
               case states.TASK.NEW_DEF :
                    console.log("get config's :: No device_config, must set default config.");
                    await setDefDev_config(id,defValues.CONFIG);//default values to BD

                    data = [devDefJSON.thermCal,devDefJSON.reportDevice,devDefJSON.sensFilter];//default Json values to send to device
                    //console.log("default device_config",data);
                    break;
               case states.TASK.GET_UPDT:
                    console.log("get config's :: No device_config updates required.");
                    data = false;
               break;
          }
          
     }

     return {error:null, data:data};
}

async function setDefDev_config(devId,rows){//set default values if it's a new device
     try{
          const keys = Object.keys(rows);

          for (const key of keys) {
               
               let affR = await Device_config.inDefaultRow(devId,rows[key].configId,rows[key].value,rows[key].pending);
          
               if(!affR){
                    logger.setLog('pendings').error(`get Configs :: Couldn't INSERT configId Row :${rows[key].configId} for device id: ${devId}`);
               }
          }
     }catch(e){
          logger.setLog('server').fatal(e);
     }
}

function dev_configSort(set,getAll){//sorts data
     var allSorted = []; var reportConfig=[]; var therm=[]; var gpios =[]; var LTEGPS =[];
     var flags ={};
    
     if(getAll){//choose to get all configs, no matter pending state...
          flags ={"REPORT":true,"THERM_CAL":true,"SENS-FILTER":true};
     }else{
          flags ={"REPORT":false,"THERM_CAL":false,"SENS-FILTER":false};
     }

     for(let i=0;i<set.length;i++){

          if(set[i].configId > 1 && set[i].configId < 7){
               if(!flags["REPORT"]){//if still false, check, when true just once, is enough to send all values
                    flags["REPORT"] = (set[i].pending) ? true : false;
               }
          }

          if(set[i].configId==2){
               let type = ("HOUR".localeCompare(set[i].value))? 1 : 0;// if strings are different set 1, else 0
               reportConfig.push(type);
               if(!type){// false is for HOUR
                    reportConfig.push(parseInt(set[2].value));
               }else{// true is for MIN
                    reportConfig.push(parseInt(set[3].value));
               }

          }else if(set[i].configId > 4 && set[i].configId < 7){//5-7
               reportConfig.push(parseInt(set[i].value));
               
          }else if(set[i].configId > 6 && set[i].configId < 11){//7-10 thermistors
               therm.push(parseInt(set[i].value));
               if(!flags["THERM_CAL"]){
                    flags["THERM_CAL"] = (set[i].pending) ? true : false;
               }

          }else if(set[i].configId > 10 && set[i].configId < 27){//11-26 gpio's 
               gpios.push(parseInt(set[i].value));
               if(!flags["SENS-FILTER"]){
                    flags["SENS-FILTER"] = (set[i].pending) ? true : false;
               }

          }else if(set[i].configId == 27 || set[i].configId == 28){// LTE GPS
               LTEGPS.push(parseInt(set[i].value));
               if(!flags["REPORT"]){
                    flags["REPORT"] = (set[i].pending) ? true : false;
               }

          }
          
     }

     const all = {//sort all data first, then later, add or not to the final array
          "REPORT": {
               "TYPE":reportConfig[0],
               "TIME": reportConfig[1],
               "LTE": (LTEGPS[0]) ? true : false,
               "GPS": (LTEGPS[1]) ? true : false,
               "SAMP-T": reportConfig[2],
               "SAMP-N": reportConfig[3]
          },
          "THERM_CAL": therm,
          "SENS-FILTER":gpios
     };

     try{
          const Fkeys = Object.keys(flags);
          var noData = false;

          for (const fkey of Fkeys) {

               if(flags[fkey]){
                   
                   allSorted.push({[fkey]:all[fkey]});
                   noData = true;
               }
          }
          //console.log(allSorted);
          
          if(noData){
               return allSorted;
          }

     }catch(e){
          logger.setLog('server').fatal(e);
     }

     return false;
}

/////////////////////////////////
///   advanced config query  ///
///////////////////////////////

async function queryAdvanced(id,scenario) {
     var data = false;
     let advRows  = await advConfig.getToUpdate(id);//query only values that have pending = 1 
   
     switch (scenario) {
          case states.TASK.NEW_DEF :

               if(queryGotSomething(advRows)){
                    
                    if(advRows.data[0].configId==5){//if what we got is the KEY , then proceed...
                         
                         console.log(`get config :: Setting default Advanced config's for the first time to id: ${id}`);
                         await setAdvDefault(id,defValues.ADV_CONFIG);

                         data = {//default Json values to send to device
                              "AV-CONF": {
                                   "KA":0,
                                   "KA-GPS": 0,
                                   "GPS-LOG": 0,
                                   "TIME":  time.actualMX(true),
                                   "KEY": advRows.data[0].value,
                                   "DAY":getActualDAY()
                              }
                         }
                   
                         error =null;
                    }else{
                         data = null;
                         error = states.ERROR._500;
                    }

               }else{//IN CASE THAT KEY (CONFIG ID= 5) PENDING FLAG IS FALSE, ASK FOR THE KEY,THIS SHOULDN'T HAPPEN, BUT MAY HAPPEN WHEN TESTING...
                    let result  = await advConfig.getKey(id);
                    //console.log("advanced config, set default, case 2 , get key first",result)
                    if(queryGotSomething(result)){

                         console.log(`get config :: Setting default Advanced config's for the first time to id: ${id}`);
                         await setAdvDefault(id,defValues.ADV_CONFIG);

                         data = {//default Json values to send to device
                              "AV-CONF": {
                                   "KA":0,
                                   "KA-GPS": 0,
                                   "GPS-LOG": 0,
                                   "TIME": time.actualMX(true),
                                   "KEY": result.data[0].value,
                                   "DAY":getActualDAY()
                              }
                         }
                         error =null;
                    }else{
                         data = null;
                         error = states.ERROR._500;
                    }
               }
               
          break;

          case states.TASK.GET_UPDT:
               if(queryGotSomething(advRows)){
                    data = advSort(advRows.data,false);// the second arg sets if you want to get all configs, no matter pending flag status
                    error =null;
                    if (data){
                         console.log("get config's :: Advanced config's to update.");  
                    }else{
                         console.log("get config's :: No Advanced updates required.");
                    }
                    
               }else{
                    data = false;
                    error = null;
                    console.log("get config's :: No Advanced updates required.");
               }
          break;

          case states.TASK.GET_ALL:
               if(queryGotSomething(advRows)){
                    data = advSort(advRows.data,true);// the second arg sets if you want to get all configs, no matter pending flag status
                    error =null;
                    if (data){
                         console.log("get config's :: Advanced config to send.");  
                    }else{
                         console.log("get config's :: No Advanced config found.");
                    }
               }else{
                    data = false;
                    error = null;
                    console.log("get config's :: No Advanced config found.");
               }
          break;
     }
   
     return {error:error, data:data};//SEND ERROR FOR A DEVICE POST RETRY
}

async function setAdvDefault(devId,rows){
     try{
          const keys = Object.keys(rows);

          for (const key of keys) {
               
               let affR = await advConfig.inDefaultRow(devId,rows[key].configId,rows[key].value,rows[key].pending);
          
               if(!affR){
                    logger.setLog('pendings').error(`get Config's :: Couldn't INSERT configId Row :${rows[key].configId} for device id: ${devId}`);
               }
          }

     }catch(e){
          logger.setLog('server').fatal(e);
     }
}

function advSort(rows,getAll){
     var update = false;

     if(getAll){
          update = true;
     }

     if(rows.length>1){
          for(let i=0;i<rows.length;i++){
               if(!update){
                    update = (rows[i].pending) ? true : false;
               } 
          }
     
          if(update){
               var config = {
                    "AV-CONF":{
                         "KA":parseInt(rows[0].value),
                         "KA-GPS": parseInt(rows[1].value),
                         "GPS-LOG": parseInt(rows[2].value),
                         "TIME":  time.actualMX(true),//SET TRUE TO SEND AS EPOCH
                         "KEY": rows[4].value,
                         "DAY":getActualDAY()
                         }
                    };
                    //console.log(config);
               return config;
          }
     }

     return false;
}

function getActualDAY(){
     let date = time.dateMX();
     let day = date.getDay();
     day = (day==0) ? 7 : day;// sunday must be send as 7
     return day;
}

/////////////////////////////////
///   monitor config query   ///
///////////////////////////////

async function queryMonitor(id,scenario) {
     var data = false;
 
     let settings = await monitorConfig.getToUpdate(id);
 
     if(queryGotSomething(settings)){// device_config values

          if(scenario==states.TASK.GET_ALL){//if is a get All no matter what scenario, then...
               data = monitorSort(settings.data,true);
           }else{
               data = monitorSort(settings.data,false);// the second arg sets if you want to get all configs no matter pending flag status
           }
 
           if(data){
                console.log("get config's :: got Monitor Config for update.");
           }else{
                console.log("get config's :: No Monitor Config  updates required.");
           }
           
      }else{
 
           if(settings.err){//If there was a en error in the query above, send error for a retry
                logger.setLog('server').error(`get config's :: error while querying truck Monitor config.`);
           
                return {error:500, data:null};
           }
      
           switch (scenario) {
                case states.TASK.NEW_DEF :
                     console.log("get config's :: No Monitor Config, must set default config.");
                     await setDefMonitor(id,defValues.MONITOR_CONF);//default values to BD
                     
                     data = devDefJSON.monitorConfig;//default Json values to send to device
                break;
                case states.TASK.GET_UPDT:
                     console.log("get config's :: No Monitor Config  updates required.");
                     data = false;
                break;
           }   
      }
 
  return {error:null, data:data};
 }
 
 async function setDefMonitor(id,rows){
      try{
           const keys = Object.keys(rows);
     
           for (const key of keys) {
               
                let affR = await monitorConfig.inDefaultRow(id,rows[key].configId,rows[key].value,rows[key].pending);
           
                if(!affR){
                     logger.setLog('pendings').error(`get Configs :: Couldn't INSERT configId Row :${rows[key].configId} for device id: ${devId}`);
                }
           }
      }catch(e){
           logger.setLog('server').fatal(e);
      }
 }

function monitorSort(rows,getAll){

     var update = false;
     if(getAll){
          update = true;
     }

     for(let i=0;i<rows.length;i++){
          if(!update){
               update = (rows[i].pending) ? true : false;
          } 
     }

     if(update){
          var config = {
                    "MONITOR-CONF":{
                         "DEF":{
                              "TH":rows[0].value,
                              "TIMEOUT":rows[1].value,
                              "STABLE": rows[2].value
                         },
                         "COMP-D":{
                              "HIGH":rows[3].value,
                              "LOW":rows[4].value,
                              "HIGH-T":rows[5].value,
                              "LOW-T":rows[6].value,
                              "OK-T":rows[7].value,
                              "STOP-H": (rows[8].value) ? true : false,
                              "STOP-L": (rows[9].value) ? true : false
                         },
                         "COMP-S":{
                              "HIGH":rows[10].value,
                              "LOW":rows[11].value,
                              "HIGH-T":rows[12].value,
                              "LOW-T":rows[13].value,
                              "OK-T":rows[14].value,
                              "STOP-H": (rows[15].value) ? true : false,
                              "STOP-L": (rows[16].value) ? true : false
                         },
                         "DOOR":{
                              "OPEN-T":rows[17].value,
                              "CLOSE-T":rows[18].value
                         },
                         "M-POWER":{
                              "ON":rows[19].value,
                              "OFF":rows[20].value,
                         },
                         "CEDIS-P":{
                              "ON":rows[21].value,
                              "OFF":rows[22].value
                         },
                         "COMP-DIFF":{
                              "TH":rows[23].value,
                              "TIME":rows[24].value,
                              "STOP":(rows[25].value) ? true : false
                         },
                         "POWERBANK-P":{
                              "FULL-V":rows[26].value,
                              "FULL-U":rows[27].value,
                              "FULL-D":rows[28].value,
                              "EMPTY-V":rows[29].value,
                              "EMPTY-U":rows[30].value,
                              "EMPTY-D":rows[31].value,
                              "DIFF": rows[32].value
                            },
                         "COMP-ON":{
                              "OFF": rows[33].value
                         }
                    }
               };
               
          return config;
     }

     return false;
}

////////////////////////////////////
///   live event config query   ///
//////////////////////////////////


async function queryLive(id,scenario) {
     var data = false;

     let settings = await liveEventConfig.getToUpdate(id);
 
     if(queryGotSomething(settings)){// device_config values
           
          
           if(scenario==states.TASK.GET_ALL){//if is a get All no matter what scenario, then...
     
               data = liveEventSort(settings.data,true);
           }else{
               data = liveEventSort(settings.data,false);// the second arg sets if you want to get all configs no matter pending flag status
           }
                      
     }else{

          if(settings.err){//If there was a en error in the query above, send error for a retry
               logger.setLog('server').error(`get config's :: error while querying Live Events config.`);
          
               return {error:500, data:null};
          }
     
          switch (scenario) {
               case states.TASK.NEW_DEF :
                    console.log("get config's :: No Live Events Config, must set default config.");
                    await setDefLive(id,defValues.LIVE_EVENT);//default values to BD
                    
                    data = devDefJSON.liveEvent;//default Json values to send to device
                    //console.log("send def as ",data);
                    break;
               case states.TASK.GET_UPDT:
                    console.log("get config's :: No Live Events updates required.");
                    data = false;
               break;
          }   
     }

     if(data){
          if(scenario==states.TASK.GET_ALL || scenario==states.TASK.GET_UPDT){
               console.log("get config's :: got Live Events Config .");
          }
     }else{
          if(scenario==states.TASK.GET_UPDT){
               console.log("get config's :: No Live Events updates required."); 
          }
     }
 
  return {error:null, data:data};
}

async function setDefLive(id,rows){
     try{
          const keys = Object.keys(rows);
    
          for (const key of keys) {
              
               let affR = await liveEventConfig.inDefaultRow(id,rows[key].eventId,rows[key].value,rows[key].pending);
          
               if(!affR){
                    logger.setLog('pendings').error(`get Configs :: Couldn't INSERT configId Row :${rows[key].configId} for device id: ${devId}`);
               }
          }
     }catch(e){
          logger.setLog('server').fatal(e);
     }
}

function liveEventSort(rows,getAll){
     var update = false;
     let parsedLive =[];
     if(getAll){
          update = true;
     }

     for(let i=0;i<rows.length;i++){
          parsedLive[i]= (rows[i].value) ? true : false;

          if(!update){
               update = (rows[i].pending) ? true : false;
          } 
     }

     if(update){
          var config = {
               "LIVE-EVENT":[...parsedLive]
               };
               
          return config;
     }

     return false;
}

/**
 * @brief
 * COMPRESSOR-CONTROL Methods:
*/

async function compControlQuery(id,scenario){
     let result=false;let settings = false;

     let deleteReq = await compSettings.deleteReq(id);
     console.log("delete Req ",deleteReq)

     if(scenario==states.TASK.GET_ALL){
          settings = await compSettings.getAll(id);
          if(!settings){
               console.log("GOT FOR DEFAULT",settings);
               result = await compressorDefault(id);
               return{ data: result, deleteReq: deleteReq, waitingSlots: result.waitingSlots, slotsToSend: result.slotsToSend};
          }
     }else{
          settings = await compSettings.forUpdate(id);
          console.log("GOT FOR UPDATE",settings);
                
     }
     
     if(settings && !result){
          console.log("settings HERE ->>>>>",settings)
          result = compControlSort(settings.slots,deleteReq);// pass deleteReq to add ID=1 if true
          return{ data: result.data, deleteReq: deleteReq, waitingSlots: result.waitingSlots, slotsToSend: result.slotsToSend};
     }
     
     return{ data: false, deleteReq: deleteReq, waitingSlots: false, slotsToSend: false };
}

function compControlSort(rows,deleteAll){
     let config = false;
     let sorted = [];
     let deleteR = false;
     let waitingSlots = [];
     let slotsToSend =[];

     console.log("R O W S HERE ->>>>>",rows)
     
     for(let i=0;i<rows.length;i++){
               
          if(i<10){ 

               switch (rows[i].controlID){
                    case 2:
                         sorted.push({
                              "ID":2,
                              "BUFF":rows[i].slot,
                              "P-CHK": (rows[i].powerCheck) ? true : false,
                              "DAYS": parseDaysArray(rows[i].daysArray),
                              "EV": (rows[i].ev) ? true : false
                         });
                    break;
                    case 3:
                         let timeD = timeDiff(rows[i].startHour,rows[i].startMin,rows[i].endHour,rows[i].endMin);
                         let pChk = null;
                         if(rows[i].powerCheck!=null){
                              pChk = {
                                   "ON-N": rows[i].powerCheck.ON_N,
                                   "ON-E": rows[i].powerCheck.ON_E,
                                   "TIMEOUT": rows[i].powerCheck.timeout,
                                   "INC": (rows[i].powerCheck.incremental) ? true : false
                              }
                         }

                         sorted.push({
                              "ID":3,
                              "BUFF":rows[i].slot,
                              "OVF": timeD.overflow,
                              "CT": timeD.secondsDiff,
                              "DAYS": parseDaysArray(rows[i].daysArray),
                              "EV": (rows[i].ev) ? true : false,
                              "P-CHK": pChk,
                              "ST":{
                                   "H":rows[i].startHour,
                                   "M":rows[i].startMin
                              },
                              "END":{
                                   "H":rows[i].endHour,
                                   "M":rows[i].endMin
                              }  
                         });
                    break;
               }//switch end
               slotsToSend.push(rows[i].slot);//slots BUFF to send

          }else{
               waitingSlots.push(rows[i].slot);//slots BUFF to the waiting line    
          }
     }//for end

     console.log("before filter waiting slots :",waitingSlots);
     console.log("before filter sending slots :",slotsToSend);

     waitingSlots = waitingSlots.sort().filter(function(item, pos, array) {//delete repeated slots
          return !pos || item != array[pos - 1];
     });

     slotsToSend = slotsToSend.sort().filter(function(item, pos, array) {//delete repeated slots
          return !pos || item != array[pos - 1];//return true if actual pos is not index 0, and if the item is different from last item
     });

     console.log("waiting slots :",waitingSlots);
     console.log("sending slots :",slotsToSend);
     if(deleteAll){
          sorted.push({"ID":1});
     }
     config = {"C-CONTROL": {"CTRL": sorted}};
     //console.log(config["C-CONTROL"]["CTRL"]);
     return {data:config, deleteReq:deleteR, waitingSlots: (waitingSlots.length) ? waitingSlots : false, slotsToSend: (slotsToSend.length) ? slotsToSend : false};               
}

function timeDiff(startH,startM,endH,endM){
     let compareByMin = (startH==endH) ? true : false;
     let difference = endH-startH;
     
     //console.log(`difference between : startH ${startH} and endH ${endH}`);
     if(compareByMin){
          difference = endM-startM;
          //console.log(`option 2 required, difference between : startM ${startM} and endM ${endM}`);
     }

     let totalSec = inSecondsDifference(startH,startM,endH,endM);

     if(difference>0){//if difference is positive, return a false overflow
          return {overflow:false,secondsDiff:totalSec};
     }
     return {overflow:true,secondsDiff:totalSec};
}

function inSecondsDifference(startH,startM,endH,endM){
     let valuestart = (startH<10) ? "0"+startH+":" : startH+":";
     valuestart += (startM<10) ? "0"+startM+":00": startM+":00";
     let valuestop = (endH<10) ? "0"+endH+":" : endH+":";
     valuestop += (endM<10) ? "0"+endM+":00" : endM+":00";
     //console.log(` start ${valuestart} end ${valuestop}`)

     let timeStart = new Date("01/01/2020 " + valuestart).getTime();
     let timeEnd = new Date("01/01/2020 " + valuestop).getTime();
     let secDiff = (timeEnd - timeStart)/1000; 
     //console.log(`ts : ${secDiff}`);

     if (secDiff < 0) {
          secDiff = (24*3600) + (secDiff);
     }
     //console.log(`seconds difference : ${secDiff}`)

     return   secDiff
}



function parseDaysArray(daysString){
   
     let array =[];
     if(daysString.includes(',')){
    
          array = daysString.split(',');
     }else{
         
          array.push(parseInt(daysString));
     }
     
     for(let i=0;i<array.length;i++){
          
          let day = parseInt(array[i]);
          
          day = (day==0) ? 7 : day;
          array[i] = day;
          
     }
     return array;
}

async function compressorDefault(deviceId){
     
     const compSlots_ = {
          slot:1,
          available:0,
          pendingUpdate:0,
          deleteReq:0
     };
     const compMain_ = {
          slot:1,
          powerCheck:1,
          daysArray:'1,3,5',
          startHour:23,
          startMin:0,
          endHour:23,
          endMin:59,
          controlID:3,
          ev:1,
          eventTitle:"default"
     };
     const compPCheck_ = {
          slot:1,
          ON_E:0,
          incremental:1
     };
     
     let timeDiffSec =  timeDiff(compMain_.startHour,compMain_.startMin,compMain_.endHour,compMain_.endMin);
     let defaultValues = [{
          "ID":3,
          "BUFF":1,
          "OVF": false,
          "CT": timeDiffSec.secondsDiff,
          "DAYS": [1,3,5],
          "EV": true,
          "P-CHK": {
               "ON-N": null,
               "ON-E": 0,
               "TIMEOUT": null,
               "INC":true
          },
          "ST":{
               "H":compMain_.startHour,
               "M":compMain_.startMin,
          },
          "END":{
               "H":compMain_.endHour,
               "M":compMain_.endMin
          }  
     }];

     let data = {
          "CTRL": defaultValues
     }

     await compSettings.setNewSlot(deviceId,compSlots_);
     await compSettings.setNewPcheck(deviceId,compPCheck_);
     await compSettings.setNewMain(deviceId,compMain_);//function was wrong

     return {"C-CONTROL": data };
}

/**
 * @brief
 * L-MOD Methods:
*/

async function queryLightSens(id,scenario) {
     let lcModules = await lightConfig.getModSettings(id);//returns max 4 rows
     var data = false;var error = null; let keepGoing=false;
   
     if(queryGotSomething(lcModules)){

          var modCodesArray = [];
          let lConfig = null;
          for(let i=0;i<lcModules.data.length;i++){
               lConfig = null;
               if(scenario==states.TASK.GET_ALL){

                    error = states.STATUS_RESP._206
                    //console.log(`got pending moduleId : ${lcModules.data[i].moduleCode}`)
                    console.log(`get config's :: got Light sens modules (task: get all) module: ${lcModules.data[i].moduleCode}`);
                    lConfig = await lightConfig.getSensConfig(lcModules.data[i].moduleCode);
                    keepGoing=true;

               }else if(lcModules.data[i].pending){//IF START
                    error = states.STATUS_RESP._206
                    //console.log(`got pending moduleId : ${lcModules.data[i].moduleCode}`)
                    console.log(`get config's :: got Light sens modules to update module: ${lcModules.data[i].moduleCode}`);
                    lConfig = await lightConfig.getSensConfig(lcModules.data[i].moduleCode);
                    keepGoing=true;
               }

               //console.log("array ",lConfig)

               if( keepGoing && queryGotSomething(lConfig)){
                    modCodesArray.push({
                         "ID"  :lcModules.data[i].modulePos,
                         "EN"  :(lcModules.data[i].enable) ? true : false,
                         "ADD" :lcModules.data[i].moduleAddress,
                         "SENS":[
                              {
                                   "TH": lConfig.data[0].treshold,
                                   "ED": (lConfig.data[0].edge) ? true : false,
                                   "FI": lConfig.data[0].filter,
                                   "ST": (lConfig.data[0].statusActive) ? true : false
                              },
                              {
                                   "TH": lConfig.data[1].treshold,
                                   "ED": (lConfig.data[1].edge) ? true : false,
                                   "FI": lConfig.data[1].filter,
                                   "ST": (lConfig.data[1].statusActive) ? true : false
                              },
                              {
                                   "TH": lConfig.data[2].treshold,
                                   "ED": (lConfig.data[2].edge) ? true : false,
                                   "FI": lConfig.data[2].filter,
                                   "ST": (lConfig.data[2].statusActive) ? true : false
                              }
                         ]
                    });
               }
               
          }
          
          if(modCodesArray.length){
               data = {
                    "L-MOD":modCodesArray
               };
               // console.log(" L M O D [1]",modCodesArray[1]);
               // console.log("data outside view",data);
          }else{
               console.log("get config's :: No Light Sens updates required.");
          }

          return {error:error, data:data};
     }else{

          if(lcModules.err){//If there was a en error in the query above, send error for a retry
               logger.setLog('server').error("get config's :: error while querying Light Modules Update.");
              
               return {error:500, data:null};
          }
         
          switch (scenario) {
               case states.TASK.NEW_DEF :
                    console.log("get config's :: No Light Sens Config's, must set default config.");
  
                    await setDefLightSens(id,defValues.LIGHT_MOD_CONFIG,defValues.LIGHT_SENS_CONFIG);//default values to BD
  
                    data = {//default Json values to send to device
                         "L-MOD":[//JUST 2 MODULES OUT OF 4 
                              devDefJSON.lightModules["L-MOD"][0],
                              devDefJSON.lightModules["L-MOD"][1]
                              //devDefJSON.lightModules["L-MOD"][0],
                              //devDefJSON.lightModules["L-MOD"][1]
                         ]
                    };
                    // console.log("LOOKS ",data);
                    // console.log("DEEPER 0 ",data["L-MOD"][0]["SENS"]);
                    // console.log("DEEPER 1 ",data["L-MOD"][1]["SENS"]);
               break;
               case states.TASK.GET_UPDT:
                    console.log("get config's :: No Light Sens updates required.");
               break;
          }
          
     }

     return {error:null, data:data};
}

async function setDefLightSens(devId,moduleRows,sensRows){
     const modulesDefMax = 2;
     var subIndex = 0;
     try{
          logger.setLog(`get config's :: Setting default modules.`);

          for(let i=0;i<modulesDefMax;i++) {
               subIndex +=1;
               var index = "module"+subIndex;

               let modulePos = moduleRows[index].modulePos;
               let enable = moduleRows[index].enable;
               let moduleAddress = moduleRows[index].moduleAddress;
               let pending = moduleRows[index].pending; 
               //INSRET MODULE CONFIG BY ROW
               await lightConfig.insertDefRow(devId,modulePos,enable,moduleAddress,pending,(result) => {
                    if(queryGotSomething(result)){
                         let moduleCode = result.insertedId;
                         
                         for(let i=1;i<4;i++){
                              let key = "sensor"+i;
                              //INSRET LIGHT SENS CONFIG BY ROW, USING THE MODULE CODE AS REFERENCE
                              lightConfig.setSensConfig(  
                                                       moduleCode,
                                                       sensRows[key].sensor,
                                                       sensRows[key].treshold,
                                                       sensRows[key].edge,
                                                       sensRows[key].filter,
                                                       sensRows[key].statusActive
                                                       );
                              //console.log("module code = ",moduleCode," key: ",key);
                         }

                         return true;  
                    }
                 
                    return false;
               });
          }

     }catch(e){
          logger.setLog('server').fatal(e);
     }
}

//NEW DEVICE ?, SET DEFAULT VALUES