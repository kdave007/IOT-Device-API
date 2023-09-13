
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
/////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////

/////// THIS CLASS IS OBSOLETE DELETE LATER///////////////////

/////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////

exports.get = async (id,scenario) => {//GET CONFIGS, DEPENDING ON PENDING FLAG STATE
     var prepare = [];
     var settings = {};

     wifiArrays = await wifiSettings.getWifi(id,scenario);//push at INDEX 0

     if(wifiArrays.error==null){//index 0 is WIFI
     
           if(wifiArrays.data){
              
               let wifiProfiles = wifiArrays.data["WIFI"];
               let eraseWifi = wifiArrays.data["WIFI-ERASE"];
               let adv = await queryAdvanced(id,scenario);
               let light = await queryLightSens(id,scenario);
               let monitor = await queryMonitor(id,scenario);
               let live = await queryLive(id,scenario);
               let compControl = await compControlQuery(id);

               var allreport = await device_config(id,scenario);
             
               if(allreport.data){
                   
                    for(let i=0;i<allreport.data.length;i++){
                         prepare.push(allreport.data[i]);
                    }
               }

               prepare.push(compControl.data);
               prepare.push(adv.data);
               prepare.push(light.data);
               prepare.push( (wifiProfiles) ? {"WIFI":wifiProfiles} : false );//if we dont get data, set false 
               prepare.push( (eraseWifi) ? {"WIFI-ERASE":eraseWifi} : false );
               prepare.push(monitor.data);
               prepare.push(live.data);

               console.log("prepare ",prepare);
               
               settings = prepare.filter((element)=>{
                    return element!=false;//only keep the objects with actual data
               });
              
               if(settings.length){
          
                    return {error:null, data:settings};
               }               

               return {error:states.STATUS_RESP._204, data:false};
          }
     }

     return {error:wifiArrays.error, data:null};
}

exports.getAll = async(id) => {//GET ALL CONFIGS, IGNORE PENDING FLAG STATE
     var prepare = [];
     var settings = {};
     var waitingLine = false;

     let wifiArrays = await wifiSettings.getWifi(id,states.TASK.NEW_DEF);

     if(wifiArrays.data==null){
          logger.setLog('server').error(`get config's :: Invalid WIFI ap!, cannot continue.`);

          return{error:204,data:null};
     }

     let wifiProfiles = false;
     let eraseWifi = false;
     
     let resObject = await pendingPackage.comprobe(id);

     if(resObject.err==null){
          if(resObject.query){
               waitingLine=resObject.pending;
          }else{
               logger.setLog('server').error(`get config's :: couldn't find any pending package flag to id: ${id}`);
          }
     }

     if(waitingLine){//if is a pending package, means that it's time to send the second package with WIFI & L-MOD

          if(wifiArrays.error==null){
               wifiProfiles = wifiArrays.data["WIFI"];
               eraseWifi = wifiArrays.data["WIFI-ERASE"];
          }
          let lsModulesRows = await lightConfig.getModSettings(id);
          let sortedLightSens = await sortAllLightSens(lsModulesRows);
          //returns data or false ^

          prepare.push(sortedLightSens);
          prepare.push( (wifiProfiles) ? {"WIFI":wifiProfiles} : false );//if we dont get data, set false 
          prepare.push( (eraseWifi) ? {"WIFI-ERASE":eraseWifi} : false );

          await pendingPackage.setPending(id,0);

     }else{
          await pendingPackage.setPending(id,1);

          let devRows = await Device_config.getConfigUpdate(id);
          
          if(queryGotSomething(devRows)){
               let sortedDev_Config = dev_configSort(devRows.data,true);// the second arg sets if you want to get all configs, no matter pending flag status
               
               if(sortedDev_Config){
                    for(let i=0;i<sortedDev_Config.length;i++){
                         prepare.push(sortedDev_Config[i]);
                    }
               }
          }//returns data or false ^

          let advRows  = await advConfig.getToUpdate(id);
          
          let sortedadv = advSort(advRows.data,true);
          //returns data or false ^

          let monitorRows = await monitorConfig.getToUpdate(id);
          let sortedMon = false;
          if(queryGotSomething(monitorRows)){
               sortedMon = monitorSort(monitorRows.data,true);// the second arg sets if you want to get all configs, no matter pending flag status
          //returns data or false ^
          }

          let liveRows = await liveEventConfig.getToUpdate(id);
          let liveSorted = false;
          if(queryGotSomething(liveRows)){
               liveSorted = liveEventSort(liveRows.data,true);// the second arg sets if you want to get all configs, no matter pending flag status
          //returns data or false ^
          }

          prepare.push(sortedadv);
          prepare.push(sortedMon);
          prepare.push(liveSorted);

     }

     settings = prepare.filter((element)=>{
                    
          return element!=false;//only keep the objects with actual data
     });

     if(settings.length){
     
          return {error:null, data:settings,secondPackage: waitingLine};
     } 
     logger.setLog('server').fatal("get config's :: couldn't get all configs");

     return {error:500,data:null};
     
}

exports.setAck = async(id,keys,extraParams) =>{
     
     for(let i=0;i<keys.length;i++){
          
          let key = cleanStringKeys(JSON.stringify(keys[i]));
   
          switch (key){
               case states.SETTINGS.AV_CONFIG :
                         console.log(`acknowledge :: ${states.SETTINGS.AV_CONFIG}`);
                         //await advConfig.setAck(id);
               break;
               case states.SETTINGS.REPORT :
                         console.log(`acknowledge :: ${states.SETTINGS.REPORT}`);
                        // await Device_config.setAckConfig(id);
               break;
               case states.SETTINGS.SENS_FILTER :
                         console.log(`acknowledge :: ${states.SETTINGS.SENS_FILTER}`);
                        // await Device_config.setAckConfig(id);
               break;
               case states.SETTINGS.THERM_CAL :
                         console.log(`acknowledge :: ${states.SETTINGS.THERM_CAL}`);
                        // await Device_config.setAckConfig(id);
               break;
               case states.SETTINGS.LIGHT_MOD :
                         console.log(`acknowledge :: ${states.SETTINGS.LIGHT_MOD}`);
                         //await lightConfig.setAck(id);
               break;
               case states.SETTINGS.LIVE_EVENT :
                         console.log(`acknowledge :: ${states.SETTINGS.LIVE_EVENT}`);
                        // await liveEventConfig.setAck(id);
               break;
               case states.SETTINGS.MON_CONFIG :
                         console.log(`acknowledge :: ${states.SETTINGS.MON_CONFIG}`);
                         //await monitorConfig.setAck(id);
               break;
               case states.SETTINGS.WIFI_CONFIG :
                         console.log(`acknowledge :: ${states.SETTINGS.WIFI_CONFIG}`);
                         //await wifiSettings.deletenAck(id);
               break;
               case states.SETTINGS.COMP_CONTROL :
                         console.log(`acknowledge :: ${states.SETTINGS.COMP_CONTROL}`);
                        // await compSettings.updatedAck(id,extraParams.compSlots);
               break;
          } 
     }

    return;
}

/**
 * @brief
 * query_name : this functions simply query the configs asked
 * name_Ack (acknowledge): this functions set the "pending" flag of every config back to false
 * to recognize that the device has updated it's config parameters. 
 * sort functions sort the data
 * set def, set default values into the DB
*/
async function compControlQuery(id){
     let result=false;

     let settings = await compSettings.forUpdate(id);
     
     if(settings){
          result = compControlSort(settings.slots,settings.deleteAll);
          return{data:result.data, deleteReq:result.deleteReq};
     }
     return{data:false, deleteReq:false};
}

function compControlSort(rows,deleteAll){
     let config = false;
     let sorted = [];
     let deleteR = false;
    console.log("sorrrrtttttt")
     for(let i=0;i<rows.length;i++){
          
          switch (rows[i].controlID){
               case 2:
                    console.log("sorrrrtttttt1")
                    sorted.push({
                         "ID":2,
                         "BUFF":rows[i].slot,
                         "P-CHK": (rows[i].powerCheck) ? true : false,
                         "DAYS": parseDaysArray(rows[i].daysArray)
                    });
               break;
               case 3:
                    console.log("sorrrrtttttt2")
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
     }//for end

    
     if(deleteAll){
          deleteR = true;
          sorted.push({"ID":1});
     }
     config = {"C-CONTROL": {"CTRL": sorted}};

     return {data:config, deleteReq:deleteR};               
}

async function device_config(id,scenario) {//query device_config values
     var data = false;
     let devConf = await Device_config.getConfigUpdate(id);
     
     if(queryGotSomething(devConf)){// device_config values
           data = dev_configSort(devConf.data,false);// the second arg sets if you want to get all configs no matter pending flag status

           if(data){
               logger.setLog('server').info("get config's :: device_config for update.");
           }else{
               logger.setLog('server').info("get config's :: No device_config updates required.");
           }
          
     }else{

          if(devConf.err){//If there was a en error in the query above, send error for a retry
               logger.setLog('server').error('get configs :: error while querying configs Update');
              
               return {error:500, data:null};//SEND ERROR FOR A DEVICE POST RETRY
          }
         
          switch (scenario) {
               case states.TASK.NEW_DEF :
                    logger.setLog('server').info("get config's :: No device_config, must set default config.");
                    await setDefDev_config(id,defValues.CONFIG);//default values to BD

                    data = [devDefJSON.thermCal,devDefJSON.reportDevice,devDefJSON.sensFilter];//default Json values to send to device
                    //console.log("default device_config",data);
                    break;
               case states.TASK.GET_UPDT:
                    logger.setLog('server').info("get config's :: No device_config updates required.");
                    data = false;
               break;
          }
          
     }

     return {error:null, data:data};
}

async function setDefDev_config(devId,rows){
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

async function queryAdvanced(id,scenario) {
     var data = false;
     let advRows  = await advConfig.getToUpdate(id);//query only values that have pending = 1 
   
     switch (scenario) {
          case states.TASK.NEW_DEF :

               if(queryGotSomething(advRows)){
                    
                    if(advRows.data[0].configId==5){//if what we got is the KEY , then proceed...
                         
                         logger.setLog('server').info(`get config :: Setting default Advanced config's for the first time to id: ${id}`);
                         await setAdvDefault(id,defValues.ADV_CONFIG);
                         
                        // var cEnd = calcEndTime(totalTime,startHour,startMin);
                        // var cEnd = calcEndTime(18000,4,4);

                         data = {//default Json values to send to device
                              "AV-CONF": {
                                   "KA":0,
                                   "KA-GPS": 0,
                                   "GPS-LOG": 0,
                                   "TIME":  time.actualMX(true),
                                   "KEY": advRows.data[0].value
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

                         logger.setLog('server').info(`get config :: Setting default Advanced config's for the first time to id: ${id}`);
                         await setAdvDefault(id,defValues.ADV_CONFIG);

                         data = {//default Json values to send to device
                              "AV-CONF": {
                                   "KA":0,
                                   "KA-GPS": 0,
                                   "GPS-LOG": 0,
                                   "TIME": time.actualMX(true),
                                   "KEY": result.data[0].value
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
                         logger.setLog('server').info("get config's :: Advanced config's to update.");  
                    }else{
                         logger.setLog('server').info("get config's :: No Advanced updates required.");
                    }
                    
               }else{
                    data = false;
                    error = null;
                    logger.setLog('server').info("get config's :: No Advanced updates required.");
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

async function queryLightSens(id,scenario) {
     let lcModules = await lightConfig.getModSettings(id);//returns max 4 rows
     var data = false;var error = null;
   
     if(queryGotSomething(lcModules)){

          var modCodesArray = [];

          for(let i=0;i<lcModules.data.length;i++){

               if(lcModules.data[i].pending){
                    error = states.STATUS_RESP._206
                    //console.log(`got pending moduleId : ${lcModules.data[i].moduleCode}`)
                    logger.setLog('server').info("get config's :: got Light sens modules to update.");
                   
                    let lConfig = await lightConfig.getSensConfig(lcModules.data[i].moduleCode);

                    if(queryGotSomething(lConfig)){
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
                    }else{
                         logger.setLog('server').error(`get config's :: couldn't retrieve sensor config's of light module id : ${lcModules.data[i].moduleCode}`);
                    }
               }
          }
          
          if(modCodesArray.length){
               data = {
                    "L-MOD":modCodesArray
               };
               // console.log(" L M O D [1]",modCodesArray[1]);
               // console.log("data outside view",data);
          }else{
               logger.setLog('server').info("get config's :: No Light Sens updates required.");
          }

          return {error:error, data:data};
     }else{

          if(lcModules.err){//If there was a en error in the query above, send error for a retry
               logger.setLog('server').error("get config's :: error while querying Light Modules Update.");
              
               return {error:500, data:null};
          }
         
          switch (scenario) {
               case states.TASK.NEW_DEF :
                    logger.setLog('server').info("get config's :: No Light Sens Config's, must set default config.");
  
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
                    logger.setLog('server').info("get config's :: No Light Sens updates required.");
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

async function queryMonitor(id,scenario) {
    var data = false;

    let settings = await monitorConfig.getToUpdate(id);

    if(queryGotSomething(settings)){// device_config values
          
          
          data = monitorSort(settings.data,false);//second arg is used to get all configs, no matter pending status

          if(data){
               logger.setLog('server').info("get config's :: got Monitor Config for update.");
          }else{
               logger.setLog('server').info("get config's :: No Monitor Config  updates required.");
          }
          
     }else{

          if(settings.err){//If there was a en error in the query above, send error for a retry
               logger.setLog('server').error(`get config's :: error while querying truck Monitor config.`);
          
               return {error:500, data:null};
          }
     
          switch (scenario) {
               case states.TASK.NEW_DEF :
                    logger.setLog('server').info("get config's :: No Monitor Config, must set default config.");
                    await setDefMonitor(id,defValues.MONITOR_CONF);//default values to BD
                    
                    data = devDefJSON.monitorConfig;//default Json values to send to device
               break;
               case states.TASK.GET_UPDT:
                    logger.setLog('server').info("get config's :: No Monitor Config  updates required.");
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

async function queryLive(id,scenario) {
     var data = false;

     let settings = await liveEventConfig.getToUpdate(id);
 
     if(queryGotSomething(settings)){// device_config values
           logger.setLog('server').info("get config's :: got Live Events Config for update.");
           data = liveEventSort(settings.data,false);// the second arg sets if you want to get all configs, no matter pending flag status
           
           }else{
 
                if(settings.err){//If there was a en error in the query above, send error for a retry
                     logger.setLog('server').error(`get config's :: error while querying Live Events config.`);
                
                     return {error:500, data:null};
                }
           
                switch (scenario) {
                     case states.TASK.NEW_DEF :
                          logger.setLog('server').info("get config's :: No Live Events Config, must set default config.");
                          await setDefLive(id,defValues.LIVE_EVENT);//default values to BD
                          
                          data = devDefJSON.liveEvent;//default Json values to send to device
                          //console.log("send def as ",data);
                          break;
                     case states.TASK.GET_UPDT:
                          logger.setLog('server').info("get config's :: No Live Events updates required.");
                          data = false;
                     break;
                }   
           }
 
  return {error:null, data:data};
}

async function setDefLive(id,rows){
     try{
          const keys = Object.keys(rows);
    
          for (const key of keys) {
               //console.log(`inserting live events ${rows[key]}`);
               let affR = await liveEventConfig.inDefaultRow(id,rows[key].eventId,rows[key].value,rows[key].pending);
          
               if(!affR){
                    logger.setLog('pendings').error(`get Configs :: Couldn't INSERT configId Row :${rows[key].configId} for device id: ${devId}`);
               }
          }
     }catch(e){
          logger.setLog('server').fatal(e);
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

function dev_configSort(set,getAll){
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
                         }
                    };
                    //console.log(config);
               return config;
          }
     }

     return false;
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
                         }
                    }
               };
               
          return config;
     }

     return false;
}

function liveEventSort(rows,getAll){
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
               "LIVE-EVENT":[
                    (rows[0].value) ? true : false,
                    (rows[1].value) ? true : false,
                    (rows[2].value) ? true : false,
                    (rows[3].value) ? true : false,
                    (rows[4].value) ? true : false,
                    (rows[5].value) ? true : false,
                    (rows[6].value) ? true : false,
                    (rows[7].value) ? true : false,
                    (rows[8].value) ? true : false,
                    (rows[9].value) ? true : false,
                    (rows[10].value) ? true : false,
                    (rows[11].value) ? true : false,
                    (rows[12].value) ? true : false,
                    (rows[13].value) ? true : false,
                    (rows[14].value) ? true : false,
                 ]
               };
               //console.log(config);
          return config;
     }

     return false;
}

function cleanStringKeys(string){
     return string.substring(2, string.length-2);
}

async function sortAllLightSens(lcModules){
     var modCodesArray = [];
     var data = false;
     if(!queryGotSomething(lcModules)){

          return false;
     }

     for(let i=0;i<lcModules.data.length;i++){

               error = states.STATUS_RESP._206
               //console.log(`got pending moduleId : ${lcModules.data[i].moduleCode}`)
               logger.setLog('server').info("get config's :: got Light sens modules to update.");
               
               let lConfig = await lightConfig.getSensConfig(lcModules.data[i].moduleCode);

               if(queryGotSomething(lConfig)){
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
               }else{
                    logger.setLog('server').error(`get config's :: couldn't retrieve sensor config's of light module id : ${lcModules.data[i].moduleCode}`);
                    return false;
               }   
     }
     if(modCodesArray.length){
          data = {
               "L-MOD":modCodesArray
          };
     }else{
          logger.setLog('server').info("get config's :: No Light Sens updates required.");
     }

     return data;
}

function calcEndTime(totalTime,startHour,startMin){
     try{
          console.log("total duration :",totalTime);
          totalTime += (startHour* 3600) + (startMin * 60);//convert to seconds and add duration
          
          console.log("on startHour: ",startHour,"in sec ",(startHour* 3600)," startMin: ",startMin," in sec ",(startMin * 60));
          console.log("total seconds",totalTime);
          let m = Math.floor((totalTime / 60) % 60);
          let h = Math.floor((totalTime / (3600)) % 24);

          console.log(" end hour: ",h," end min: ",m);

          return {hour:h,min:m};
     }catch(e){
          logger.setLog('server').error('error parsing C-TIME,C-HOUR & C-MIN to C-END-HOUR & C-END-MIN');
          return {hour:0,min:0};
     }
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
     console.log("parse",daysString);
     let array =[];
     if(daysString.includes(',')){
          console.log("case 1",daysString.includes(','))
          array = daysString.split(',');
     }else{
          console.log("case 2")
          array.push(parseInt(daysString));
     }
     
     for(let i=0;i<array.length;i++){
          console.log(day,"to")
          let day = parseInt(array[i]);
          day = (day==0) ? 7 : day+1;
          array[i] = day;
          console.log(day,"to")
     }
     return array;
}