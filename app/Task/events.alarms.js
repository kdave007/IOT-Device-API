const eventsAlarms = require('./Controllers/events.alarms.controller');
const compMonitor = require('./compressor.monitor.controller');
let moment = require('moment-timezone');
const dateTime = require('../Auxiliary_Classes/date.time');
const logger = require('../Auxiliary_Classes/logger');

exports.watchdogRoutine = async() => {
     let events = await eventsAlarms.recentLogs();
     logger.setLog('debug').debug("*****************LOGS FOUND:");
     logger.setLog('debug').debugDate();
     logger.setLog('debug').debug(events);
     logger.setLog('debug').debug("**************************");
     
     if(!events.error){
          let alarms = await orderBySubscribers(events);
          return {error:null,alarms,devices:events.devicesList,compEventAfter:alarms.compEventAfter};
     }
     return {error:true};
}

exports.after = async(rows,devices) => {
    await eventsAlarms.afterSent(rows,devices);
}

async function orderBySubscribers({allLogs,devicesList}){
     let subscribers = await eventsAlarms.findSubscriptions(devicesList);
     
     if(subscribers){
          return await assignLogs(allLogs,subscribers);
     }   
     return false;
}

async function assignLogs(allLogs,subscribers){
     let atLeastOne = false;
     let currentDate = getCurrentMxDate();


     console.log(currentDate)

     for(let i = 0;i<subscribers.length;i++){
          let relatedLogs = [];
          let relatedRows = [];
          
          let loggedAllIds = false;

          for(let index = 0; index<subscribers[i].events.length; index++){
               let referenceEvent = subscribers[i].events[index];
              
               for(let c = 0; c<allLogs.length; c++){
                    let logInfo = allLogs[c];
                   
                    if(logInfo.deviceId == referenceEvent.deviceId){ 

                         if(relatedEvents(logInfo.codeId,referenceEvent.codeId)){
                             
                              if(logInfo.codeId==23){
                                   
                                   let params = parseCompressorEvent(logInfo);
                                   if(params){
                                        await reportCompEv(params);
                                   }
                              }else{
                                   let message = formatMessage(logInfo);
                                   relatedLogs.push(message);
                              }
                              atLeastOne = true;
                         }
                    }
                    if(!loggedAllIds){
                         relatedRows.push(logInfo.rowId);
                    }
                    
               }
               loggedAllIds = true;
          }

          subscribers[i]["messages"]= relatedLogs;
          
          subscribers[i]["rows"]= relatedRows;
     }
    
     return (atLeastOne) ? {subscribers,allLogs} : false;
}

function formatMessage(rawLog){//attachedMSSG
     const ALARM_TEXT = require('./Fixed_Models/live.events.text');
     let daysInSpanish =["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
     let monthsInSpanish = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre','Diciembre'];
     
     let d = new Date(rawLog.timestamp);
     const fixedSec =(d.getSeconds()<10) ? ("0"+d.getSeconds()) : d.getSeconds();
     const fixedMin=(d.getMinutes()<10) ? ("0"+d.getMinutes()) : d.getMinutes();
     const fixedHour=(d.getHours()<10) ? ("0"+d.getHours()) : d.getHours();

     let dateFormat = daysInSpanish[d.getDay()]+" "+d.getDate()+" de "+monthsInSpanish[d.getMonth()]+" del "+d.getFullYear();
     let timeFormat = fixedHour+':'+fixedMin+':'+fixedSec+' hrs.';

     let message = `Dispositivo de ID : ${rawLog.deviceId},`;
     message +=` se detecto que ${ALARM_TEXT[rawLog.codeId].text}. registrado : ${dateFormat} a las ${timeFormat}`
     
     return message;
}

function relatedEvents(postEventID,subscriberEventID){
     if(postEventID == 23 && (postEventID == subscriberEventID)){
          return true;
     }
     if(postEventID>15){
          let result = relatedIDs(postEventID,subscriberEventID);
          return result;
     }else if(postEventID == subscriberEventID){
          return true;
     }
     return false;
}

function relatedIDs(postEventID,subscriberEventID){
     switch (subscriberEventID){
          case 16:
               if(postEventID==16 || postEventID==17) return true;
          break;
          case 17:
               if(postEventID==18 || postEventID==19) return true;
          break;
          case 18:
               if(postEventID==20) return true;
          break;
          case 19:
               if(postEventID==21 || postEventID==22) return true;
          break;
     }    
     return false;
}

function getCurrentMxDate(){
     return new Date(actualTimeMX());
}

function actualTimeMX(){
     let mainDate = new Date();
     return moment.tz(mainDate, "America/Mexico_City").format("YYYY-MM-DD HH:mm:ss");
}

function parseCompressorEvent(reference){//PENDING OPTIMIZATION <-------------------------------
     let slot = Number(reference.attachedMsg);
     let day = null;
     let timestamp = Number(reference.timestamp);

     let currentDate = dateTime.sortDateFormat(false,true);
     currentDate = new Date(currentDate);
     currentDay = new Date(currentDate).getDay();
     currentTime = new Date(currentDate).getTime();
     let yesterDayTime = currentTime-86400000;
     let yesterDay = new Date(yesterDayTime).getDay();

     logger.setLog("debug").debugDate("*********NEW COMPRESSOR EVENT FOUND");
     logger.setLog("debug").debug(reference);
     if(!isNaN(timestamp) && timestamp>1603566549){//24/10/2020...
          day = new Date(timestamp).getDay();
          if(!isNaN(slot) && slot>0){
               if(day==currentDay || day==yesterDay){// MOST TEST THIS LOGIC TO OPTIMIZE!!!! <-----------------------
                    return {deviceId:reference.deviceId,slot,day};
               }
          }
     }
     return false;
}

async function reportCompEv(params){
     const ACKNOWLEDGE = 1;
     try{
          logger.setLog("debug").debug("INSERTING COMPRESSOR EVENT:")
          logger.setLog("debug").debug(params);
          logger.setLog("debug").debug("*********");
          await compMonitor.setOpReported(params.deviceId,params.slot,ACKNOWLEDGE);
     }catch(error){          
          logger.setLog("debug").fatal(" events alarms :: setOP Reported ");
          logger.setLog("debug").fatal(error);
     }
}