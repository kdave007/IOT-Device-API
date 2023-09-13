const controlComp = require('../Query_Classes/Device_Settings/control.comp');
const dateTime = require('../Auxiliary_Classes/date.time');
const logger = require('../Auxiliary_Classes/logger');

exports.getByRange = async(deviceId,start,end) => {
     console.log("rules","start",start,"end",end)
     logger.setLog('compressor').compressor("....RANGE PARAMS: device "+deviceId);
     logger.setLog('compressor').compressor("start:");
     logger.setLog('compressor').compressor(start);
     logger.setLog('compressor').compressor("end:");
     logger.setLog('compressor').compressor(end);
     logger.setLog('compressor').compressor("....");
     let list = await getSlots(deviceId);
     if(list){
          list = prepareRows(list);
          let checkList = fetchTargets(list,start,end);
          if(checkList){
               return checkList;
          }
     }
     return false;
}


async function getSlots(deviceId){
     let scheduleList = await controlComp.getComplex(deviceId);
     if(scheduleList.err==null && scheduleList.data){
          return scheduleList.data;
     }
     return false;
}

function fetchTargets(scheduleList,start,end){
     let targets = [];
     for(let index = 0; index<scheduleList.length; index++){
          let targetFound = filterTargets(scheduleList[index],start,end);
          
          if(targetFound){
               console.log("MUST ADD/////");
               console.log(scheduleList[index])
               targets = [
                    ...targets,
                    scheduleList[index]
               ];
          }
     }
     
     return (targets.length) ? targets : false;
}

function prepareRows(scheduleList){
     for(let i = 0; i<scheduleList.length; i++){
          scheduleList[i].daysArray = parseDaysArray(scheduleList[i].daysArray);
     }
     return scheduleList;
}

function parseDaysArray(daysString){
     let array = daysString.split(',');
     for(let i=0;i<array.length;i++){
          array[i]=parseInt(array[i]);
     }
     return array;
}

function filterTargets(schedule,start,end){
     
     let overFlow = (start.day==end.day) ? false : true;

     if(!overFlow){
          console.log("case 1",schedule.slot)
          return uniqueDay(schedule,start,end);
     }else{
          console.log("case 2",schedule.slot)
          return splitDays(schedule,start,end);
     }
}

function uniqueDay(schedule,start,end){
     let limit = {
          day:start.day,
          start:{hour:start.hour,min:start.min},
          end:{hour:end.hour,min:end.min}
     }
     let startDayIndex = schedule.daysArray.indexOf(limit.day);
     
     if(startDayIndex!=-1){
          return sameDayComparison(schedule,limit);
     }
     return false;
}

function sameDayComparison(x,limit){
     if(x.startHour==limit.start.hour){
          if(x.startMin>limit.start.min){
               return nextComparison(x,limit);
          }
     }else if(x.startHour>limit.start.hour){
          return nextComparison(x,limit);
     }
     return false;
}

function nextComparison(x,limit){
     if(x.startHour==limit.end.hour){
          if(x.startMin<limit.end.min){
               return true;
          }
     }else if(x.startHour<limit.end.hour){
          return true
     }
     return false;
}

function splitDays(schedule,start,end){
     let matchedA = false; matchedB = false;
     let limit = {
          lower:{
               day:start.day,
               start:{hour:start.hour,min:start.min},
               end:{hour:23,min:59},//must be constant values
               reference:"lower"
          },
          upper:{
               day:end.day,
               start:{hour:0,min:0},//must be constant values
               end:{hour:end.hour,min:end.min},
               reference:"upper"
          }
     }
     let startDayIndex = schedule.daysArray.indexOf(limit.lower.day);
     if(startDayIndex!=-1){
          matchedA = compareTimes(schedule,limit.lower,limit.lower.reference);
     }
     let endDayIndex = schedule.daysArray.indexOf(limit.upper.day);
     if(endDayIndex!=-1){
          matchedB = compareTimes(schedule,limit.upper,limit.upper.reference);
     }
     console.log(schedule.slot," matchedA",matchedA,"matchedB",matchedB)
     if(matchedB || matchedA){
          return true;
     }
     return false;
}

function compareTimes(x,limit,scenario){
     if(scenario=="upper"){
         
          return upperLimitComparison(x,limit);

     }else if(scenario=="lower"){
         
          return lowerLimitComparison(x,limit);

     }

     return false;
}

function lowerLimitComparison(x,limit){
     // console.log("lower compare ",x," limit",limit);
     if(compareStart(x,limit)){
          if(compareEnd(x,limit)){
               console.log("TRUE comparison:",x.slot,"on first day");
               return true;
          }
     }
     return false;
}

function upperLimitComparison(x,limit){
     // console.log("upper compare ",x," limit",limit);
     if(compareStart(x,limit)){
          if(compareEnd(x,limit)){
               console.log("TRUE comparison:",x.slot,"on second day");
               return true;
          }
     }
     return false;
}

function compareStart(x,limit){
     if(x.startHour==limit.start.hour){
          if(x.startMin>=limit.start.min){
               return true;
          }
     }else if(x.startHour>=limit.start.hour){
          return true;
     }
     return false;
}

function compareEnd(x,limit){
     if(x.startHour==limit.end.hour){
          if(x.startMin<=limit.end.min){
               return true;
          }
     }else if(x.startHour<=limit.end.hour){
          return true;
     }
     return false;
}