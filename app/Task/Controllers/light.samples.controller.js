const logger = require('../../Auxiliary_Classes/logger');
const lightSensors = require('../../Query_Classes/Samples/light.samples.model');
const lastValidation = require('../../Query_Classes/Samples/last.samples.validtaion');
const time = require('../../Auxiliary_Classes/date.time');
const paramProv = require('../../Query_Classes/Device_Settings/mail.alerts.model');

exports.findAlertParams = async () => {
     const alertType = 7;
     let params = await paramProv.getAlertParamsbyType(alertType);
     if(params.err==null){
         return (params.data.length) ? params.data : false;
     }
     return false;
}

exports.getSortedbyPeriods = async (deviceID,sensor,range) => {//<----uncomment
     //range = {start:'2020-08-13 00:00:00',end:'2020-08-13 23:00:00'} <------ TEST 
     
     console.log(range);
     let rawSamples = await lightSensors.getSamplesbyDates(deviceID,range.start,range.end);
     if(rawSamples.err==null){
         let sortedSamples = byTimeSegments(rawSamples.data,sensor);
         return sortedSamples;
     }
     logger.setLog("server").fatal("light samples controller :: couldn't sort data");
     return false;
}

exports.findRange = async () => {
     let lastDate = await lastValidation.getLastTS(1);
     return sortDate(lastDate);
}

exports.findFelonies = async (sortedSamples,reference,sensor) => {
     let felonies = await getFelonies(sortedSamples,reference,sensor);
     return felonies;
}

function sortDate(lastDate){
     //adds end date based on actual date time
     let start = null;
     let end = time.sortDateFormat(false,true);
     let today = time.sortDateFormat(false,false);

     if(lastDate.err==null){
          start = (lastDate.data.length) ? time.sortDateFormat(lastDate.data[0].end,true) :  today+' 00:00:00';
     }else{
          start = today+' 00:00:00';
     }

     return {start,end};
}

function byTimeSegments(rawSamples,sensor){
     //segment samples by time periods related to it's binary state
     let sortedSamples=[];
     let lastState = null;
     let startingPoint = null;
     let updateStartingPoint = true;
     for(let index = 0; index<rawSamples.length;index++){
          //now listen when a state change and save the timestamp and sum up all seconds
          let currentState = findStatus(sensor,rawSamples[index]);

          if(lastState!=null && currentState!=lastState){
               //index >0 and state change, close segment
               updateStartingPoint = true;
               sortedSamples.push({
                    startingPoint,
                    endingPoint:rawSamples[index],
                    totalSeconds:totalTime(startingPoint,rawSamples[index])
               });  
          }else if(index == (rawSamples.length-1)){
               //no state change found and last index?, close segment here
               sortedSamples.push({
                    startingPoint,
                    endingPoint:rawSamples[index],
                    totalSeconds:totalTime(startingPoint,rawSamples[index])
               });
          }
          
          if(updateStartingPoint){
               //if state change, add new segment start
               startingPoint = rawSamples[index];
               updateStartingPoint = false;
          }
          
          lastState = currentState;
     }
     return (sortedSamples.length) ? sortedSamples : false;
}

function findStatus(sensorNumber,sample){
     return sample["statusS"+sensorNumber];
}

function totalTime(startRow,endRow){
     let start = new Date(startRow.timeStamp);
     let end = new Date(endRow.timeStamp);
     // let start = new Date(startRow.insertTimeStamp);//<--------- TEST
     // let end = new Date(endRow.insertTimeStamp);//<--------- TEST
     let seconds = end.getTime() - start.getTime();
     seconds = (seconds/1000);
     
     return seconds; 
}

async function getFelonies(sortedSamples,reference,sensor){
     sensor = (sensor=="" || sensor==undefined || sensor==0 || sensor>3) ? false : sensor;
     if(sensor){
         let result = await samplesValidation(sortedSamples,reference,sensor);
         return result;
     }
     return false;
}

async function samplesValidation(sortedSamples,reference,sensor){
     let felonies = [];
     let timeout = reference.timeout/1000;//millis to seconds
     for(let index = 0; index<sortedSamples.length;index++){
          // console.log("id ",sortedSamples[index].startingPoint.deviceId," check ",sortedSamples[index].totalSeconds," > ",timeout)
          if(sortedSamples[index].startingPoint["statusS"+sensor]){
               if(!isNaN(sortedSamples[index].totalSeconds) && sortedSamples[index].totalSeconds>=timeout){
                    let users = await paramProv.getUsersbyID(reference.alertType,sortedSamples[index].startingPoint.deviceId);
                    felonies.push({
                         startingPoint : sortedSamples[index].startingPoint,
                         endingPoint : sortedSamples[index].endingPoint,
                         totalSeconds : sortedSamples[index].totalSeconds,
                         toUsers : (users.err==null) ?  users.data :false
                    });
               }
          }
     }
     return (felonies.length) ? felonies : false;
}
