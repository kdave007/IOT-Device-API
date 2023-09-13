const controlComp = require('../Query_Classes/Device_Settings/control.comp');
const compLastCheck = require('../Query_Classes/Events/compressor.last.check');
const dateTime = require('../Auxiliary_Classes/date.time');
let moment = require('moment-timezone');
const deviceConfig = require('../Query_Classes/Device_Settings/device.config');
const scheduleProvider = require('./comp.schedule.provider');
const logger = require('../Auxiliary_Classes/logger');
const MIN_ERROR = 30;//Minutes margin error of device report post

exports.watchdogRoutine = async() => {
     let currentTime = dateTime.sortDateFormat(false,true);
     let devicesList = await devicesFound(currentTime);
    
     if(devicesList){
          let checkList = await filterDevices(devicesList);
          if(checkList){
               console.table(checkList);
               let missingEvents = getMissingReports(checkList);
               logger.setLog('compressor').compressor(`!!!!! NO REPORTED EVENTS:`);
               logger.setLog('compressor').compressor(missingEvents);
     
               await resetOpReported(checkList);
               await setLatestCheck(devicesList);

               return missingEvents;
          }
          
     }

     return false;
}

exports.parseMessage = (missingEvents) => {
     if(missingEvents){
          return formatMessageOfMissing(missingEvents);
     }
    return false;
}

//pending tasks: 
//select and insert the right timestamp on LASTCHECK
//comprobe opReported flag
//set all opRported flag's to false
//send mail
//on the other server:
//set opReported flag to true
//after getting a comp event post (validate TIME date before setting the flag up)

async function devicesFound(currentTime){
     let result = await deviceConfig.getReport();
     if(result.err==null && result.data){
          return await findDevices(result.data,currentTime);
     }
     return false;
}

async function findDevices(reportConfigs,currentTime){
     let sortedList = sortConfigs(reportConfigs);
     return await findMatches(sortedList,currentTime);
}

function sortConfigs(reportConfigs){
     const config = ["null","null","mode","hour","interval"];
     let devicesParams = [];
     for(let i = 0; i < reportConfigs.length; i++){
          let currentDeviceId = reportConfigs[i].deviceId;
          let currentConfig = config[reportConfigs[i].configId];
          let indexFound = devicesParams.findIndex( (element) => element.deviceId == currentDeviceId);
          if(indexFound==-1){
               indexFound = devicesParams.push({deviceId :currentDeviceId });
               indexFound = indexFound-1;
          }
          devicesParams[indexFound][currentConfig] = (currentConfig!="null" && currentConfig!="mode") ? parseInt(reportConfigs[i].value) : reportConfigs[i].value;
     }
     
     return devicesParams;
}

async function findMatches(sorted,currentTime){
     let matches = [];
     for(let i = 0; i < sorted.length; i++){
         
          let mustCheck = await reportModeSort(sorted[i],currentTime);
          //console.log(sorted[i],"got result ",mustCheck);
          if(mustCheck){
               matches = [...matches,sorted[i]];
          }
     }
     return (matches.length) ? matches : false;
}

async function reportModeSort(reference,currentTime){
     let date = new Date(currentTime);
     let dateTime = {day:date.getDay(),hours:date.getHours(),minutes:date.getMinutes()};
     //console.log("dateTime 1",dateTime);
     let lastCheckpoint = await lastCheck(reference.deviceId);
     if(lastCheckpoint){
          let latestDay = new Date(lastCheckpoint).getDay();//needs to comprobe the last check date, so we dont check twice the same day
          if(reference.mode=="INT"){
             
               if(compareByInterval(dateTime,latestDay)){
                    logger.setLog('compressor').compressor(`device ID: ${reference.deviceId} report match:`);
                    logger.setLog('compressor').compressor(reference);
                    reference.lastCheck = lastCheckpoint;
                    return true;
               }
               
          }else if(reference.mode=="HOUR"){
               
               let fixedHour =  {hours:reference.hour,minutes:0};
               if(compareBySchedule(fixedHour,dateTime,latestDay)){
                    logger.setLog('compressor').compressor(`device ID: ${reference.deviceId} report match:`);
                    logger.setLog('compressor').compressor(reference);
                    reference.lastCheck = lastCheckpoint;
                    return true;
               }
          }
     }
     return false;
}

function compareByInterval(dateTime,latestDay){
     if(latestDay==dateTime.day) return false;

     if(dateTime.hours==0 && dateTime.minutes>=MIN_ERROR){
          return true;
     }else if(dateTime.hours>0){
          return true;
     }
     return false;  
}

function compareBySchedule(benchmark,dateTime,latestDay){
     if(latestDay==dateTime.day) return false;

     if(benchmark.hours==dateTime.hours){
          let minutesDiff = dateTime.minutes-benchmark.minutes;
          if(minutesDiff>=MIN_ERROR){
               return true;
          }
     }else if(benchmark.hours<dateTime.hours){
         
          return true;
          
     }
     return false;
}

function getMissingReports(checkList){
     let missing = checkList.filter( (element) => element.opReported == 0);
     return (missing.length) ? missing : false;
}

async function resetOpReported(checkList){
     const RESET_STATUS = 0;
     let pastId = undefined;
     let pastSlot = undefined;
     for(let i = 0; i<checkList.length; i++){
          let alreadyDone = ( pastId==checkList[i].deviceId && pastSlot==checkList[i].slot) ? true : false;
          if(!alreadyDone && checkList[i].opReported){
               //console.log("RESET device ID ",checkList[i].deviceId," ON slot ",checkList[i].slot)
               await controlComp.setOpReported(checkList[i].deviceId,checkList[i].slot,RESET_STATUS);
          }
          pastId=checkList[i].deviceId;
          pastSlot=checkList[i].slot;
     }
}

async function filterDevices(devices){
     let checkList = [];
     let currentDate = new Date(dateTime.sortDateFormat(false,true));

     for(let i = 0; i < devices.length; i++){
          let scheduleRange = await fetchSchedule(devices[i],currentDate);
          //console.log("device ID ",devices[i].deviceId,"range check:",scheduleRange);
          if(scheduleRange){
               let deviceSchedule= await scheduleProvider.getByRange(devices[i].deviceId,scheduleRange.start,scheduleRange.end);
               if(deviceSchedule){
                    
                    checkList.push(...deviceSchedule);
                    logger.setLog('compressor').compressor(`last CHECK ${devices[i].lastCheck}`);
                    logger.setLog('compressor').compressor(`expected EVENTS:`);
                    logger.setLog('compressor').compressor(deviceSchedule);
               }
          }
     }
     
     return (checkList.length) ? checkList : false;
}

async function lastCheck(deviceId){//UNCOMMENT LINE HERE AFTER TEST DONDE <------
     let queryResult = await compLastCheck.get(deviceId);
     if(queryResult.err==null){
          if(queryResult.data){
               return queryResult.data[0].checkpointDate;
          }else{
               //insert very first checkpoint and then ignore till next check, MX time
               let checkin = dateTime.addTime(false,"minutes",MIN_ERROR);
               console.log(`ON DEVICE ${deviceId}, INSERT checkpointDate : ${checkin}`)
               //await checkinCompressorEvent(deviceId,checkin);//UNCOMMENT WHEN READY!!! <------------------
          }
     }
     return false;
}

async function fetchSchedule(deviceRef,currentDate){
   
     let range = calculateRange(deviceRef,currentDate);
     if(range){
          return range;
     }
     return false;
}

function calculateRange(deviceRef,currentDate){
     if(deviceRef!=undefined && deviceRef!=null ){
          let lastCheck = new Date(deviceRef.lastCheck);
          //console.log("check",lastCheck,"hours",lastCheck.getHours());
          let start = {day:lastCheck.getDay(),hour:lastCheck.getUTCHours(),min:lastCheck.getUTCMinutes()};
          let end = {};

          if(deviceRef.mode=="INT"){
              
               let fixedRef = {day:currentDate.getDay(),hour:0,min:0+MIN_ERROR};
               end = validateCheckpoints(lastCheck,currentDate,fixedRef);
               return {start,end};
          }else if(deviceRef.mode=="HOUR"){
              
               let fixedRef = {day:currentDate.getDay(),hour:deviceRef.hour,min:0+MIN_ERROR};
               end = validateCheckpoints(lastCheck,currentDate,fixedRef);
               return {start,end};
          }
     }
     return false;
}

function validateCheckpoints(lastCheck,currentDate,fixedReference){
     let lastTime = {day:lastCheck.getDay(),hour:lastCheck.getUTCHours(),min:lastCheck.getUTCMinutes()};
     let currentTime = {day:currentDate.getDay(),hour:fixedReference.hour,min:fixedReference.min};

     if(lastTime.day==currentTime.day){
          if(lastTime.hour==currentTime.hour){
               if(lastTime.min>=currentTime.min){
                    let day = (currentDate.getDay()==6) ? 0 : currentDate.getDay()+1;
                    console.log("returning 1:",{day,hour:fixedReference.hour,min:0+MIN_ERROR})
                    return {day,hour:fixedReference.hour,min:0+MIN_ERROR};
               }
          }else if(lastTime.hour>currentTime.hour){
               let day = (currentDate.getDay()==6) ? 0 : currentDate.getDay()+1;
               console.log("returning 2:",{day,hour:fixedReference.hour,min:0+MIN_ERROR})
               return {day,hour:fixedReference.hour,min:0+MIN_ERROR};
          }
     }
     console.log("returning 3:",currentTime)
     return currentTime;
}


exports.setOpReported= async(deviceId,slot,status) => {
     await controlComp.setOpReported(deviceId,slot,status);
}


async function setLatestCheck(devicesList){
     for(let i = 0; i < devicesList.length; i++){
          let checkin = calculateCheckin(devicesList[i]);
          console.log("CHECKIN",checkin);
          console.log("DEVICE : ",devicesList[i].deviceId)
          if(checkin){
              await checkinCompressorEvent(devicesList[i].deviceId,checkin);
          }else{
               logger.setLog("debug").fatal(" comp monitor controller :: setLatestCheck checkin calculation error ");
               logger.setLog("debug").fatal(devicesList[i]);
          }
          
     }    
}
async function checkinCompressorEvent(deviceId,checkin){
     try{
          await compLastCheck.set(deviceId,checkin);
     }catch(error){
          logger.setLog("debug").fatal(" comp monitor controller :: checkinCompressorEvent ");
          logger.setLog("debug").fatal(error);
     }    
     
}

function calculateCheckin(device){
     let currentDate = dateTime.sortDateFormat(false,false);
     if(device.mode=="INT"){
          currentDate=currentDate+" 00:30:00";
          return currentDate;
     }else if(device.mode=="HOUR"){
          let hours = (device.hour<10) ? "0"+device.hour : device.hour;
          let minutes = (MIN_ERROR<10) ? "0"+MIN_ERROR : MIN_ERROR;
          currentDate+=` ${hours}:${minutes}:00`;
          return currentDate;
     }
     return false;
}

function formatMessageOfMissing(missingEvents){
     
     let usersFound = [];
     let parsedByUser = {};
     for(let index = 0; index<missingEvents.length; index++){
          let currentUserId = missingEvents[index].userId;
          let indexFound = usersFound.indexOf(currentUserId);
          if(indexFound==-1){
               usersFound.push(currentUserId);
          }

          let newMessage = formatCompressor(missingEvents[index]);
          if(parsedByUser["user"+currentUserId]!=null && parsedByUser["user"+currentUserId]!=undefined ){
               parsedByUser["user"+currentUserId].messages+=` \n`+newMessage;
          }else{
               parsedByUser["user"+currentUserId] = {
                    name: missingEvents[index].name,
                    mail: missingEvents[index].email,
                    subject : "Alarma de operación de compresor",
                    messages: newMessage
               }
          }
          
     }
     return (usersFound.length) ? {parsedByUser,usersFound} : false;
}

function formatCompressor(raw){
     raw.startHour = (raw.startHour<10) ? '0'+raw.startHour : raw.startHour;
     raw.startMin = (raw.startMin<10) ? '0'+raw.startMin : raw.startMin;
     raw.endHour = (raw.endHour<10) ? '0'+raw.endHour : raw.endHour;
     raw.endMin = (raw.endMin<10) ? '0'+raw.endMin : raw.endMin;
     let start = `${raw.startHour}:${raw.startMin}` ;
     let end = `${raw.endHour}:${raw.endMin}`;
     let text = `Dispositivo de ID: ${raw.deviceId}, no reporto que el compresor haya operado durante el periodo de las ${start}hrs a las ${end}hrs`+
     ` que está establecido en su rutina de operación.[Operación : ${raw.eventTitle}]`; 

     return text;
} 