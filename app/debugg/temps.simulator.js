const sql = require("../models/db.connection");
const tempsProvider = require("../models/get.temps");
var moment = require('moment-timezone');
const logger = require('./logger');



//DEBUG AUX DATABASE TABLE : "temp_sim_dates_record"

/*
warning note:
in order to execute this script successfully, you have to consider that if this is the very first time executing
this script, or, being more specific, it the table "temp_sim_dates_record" has 0 records or rows, you should avoid
to execute this script at 00:00:00 hours, to prevent malfunction or bugs.
*/

var firstRecord = false;
const refId = 2;
const simId = 5;

const TempSimulator= function() {
};

TempSimulator.start = async () => {
   logger.setLog("temp_bot").info("------------ Mexico time : "+sortDateFormat(false,true));
     
   let lastTimeStamp;
   let fixend
   let recordsRow = await queryLastRecord();
   let record = handleRecordsQuery(recordsRow);

   if(!firstRecord){
     lastTimeStamp = record.end;
     fixend = smartRangeTS(record.end,record.realInsertion);
  }else{//if its the 1st time making a record, we need to adjust the start and end
     lastTimeStamp = record.start;  
     fixend = record.end
   }

     //CHECK BEFORE END OF SAMPLES ON MARCH 7TH ?
   if(record){
        let tempRows = await queryTempRows(lastTimeStamp,fixend,refId); 
    
        if(tempRows){
          let success = await insertTempRows(tempRows,lastTimeStamp,fixend);

            if(success.err==null){
              logger.setLog('temp_bot').info("rows inserted successfully, inserting record timestamp");
              insertRecord(simId,lastTimeStamp,fixend,tempRows.length);
            }
       } 
   }
   console.log("simulation FINISHED");
};

async function queryLastRecord(){ //temp_sim_dates_record
     const mainQuery = `SELECT * FROM temp_sim_dates_record 
                         WHERE simulatedId = 5
                         ORDER BY realInsertion DESC LIMIT 1`;
     
     let con = await sql.connect();
     
     await con.query( mainQuery).then( ([rows,fields]) => {// await this promise
          console.table(rows);
         
          if (rows.length) {
               result = {err:null,success:rows};
          }else{
               result = {err:null,success:false};
          }
          
          con.end()
        })
        .catch((error)=>{//handle error
          logger.setLog("temp_bot").info("handle query last record temps simulator : error found");
          logger.setLog("temp_bot").fatal(error);
          result = {err:error,success:null};
        });   
      
        return result;
}

function handleRecordsQuery(resultRow){
     //console.log("handleRecords ",resultRow);
     if(resultRow.err){
         
          return false;
     }else if(!resultRow.success.length){
          let todayFixed = sortDateFormat(false,false)+" 00:00:00";
          firstRecord = true;
          let defaultRecord = {
               start:"2020-01-01 00:00:00",
               end:smartRangeTS("2020-01-01 00:00:00",todayFixed),
               simulatedId:"5",
               realInsertion:todayFixed
          }
         
          return defaultRecord;
     }else{
         
          return resultRow.success[0];
     }
}

async function queryTempRows (start,end,refId){
     start =sortDateFormat(start,true);
     end =sortDateFormat(end,true);
     
     let rows = await tempsProvider.getNormalSort(refId,start,end);

     logger.setLog("temp_bot").info("queryTemps from "+start+" to "+end);
     
    // console.table(rows.data);

     if(rows.err){

           return false;
     }else if(rows.data==null){//result has 0 rows, but still is a valid result
         insertRecord(simId,start,end,0);

          return false;
     }else if(rows.data.length){

          return rows.data;
     }
}

async function insertTempRows(rows,refStart,refEnd){
     var affectedRows = 0;
     for(let i =0;i<rows.length;i++){

          const patchedTS = datesHandler(rows[i].timestamp,refStart,refEnd);
          const mainQuery = `INSERT 
          INTO device_data_temp_volt
          SET deviceId=5,timestamp="${patchedTS}",temp1=${rows[i].temp1},temp2=${rows[i].temp2},temp3=${rows[i].temp3},temp4=${rows[i].temp4},voltage=0`;
         
         // console.log(`SET deviceId=5,timestamp=${patchedTS},temp1=${rows[i].temp1},temp2=${rows[i].temp2},temp3=${rows[i].temp3},temp4=${rows[i].temp4},voltage=0`);
          
          let con = await sql.connect();
          var res = await con.query( mainQuery).then( ([rows,fields]) => {// await this promise
    
               affectedRows = affectedRows+ rows.affectedRows
               if (rows.affectedRows) {
                    result = {err:null,success:true};
               }else{
                    result = {err:null,success:true};
               }
               con.end()

               return result;
          })
             .catch((error)=>{//handle error
               logger.setLog("temp_bot").info("dates handler query error found");
               logger.setLog("temp_bot").fatal(error);
               return result = {err:error,success:null};
             });
          
     }
     logger.setLog("temp_bot").info("total rows added "+affectedRows);
     return res.success;
}

function datesHandler(originalTS,rangeStart,rangeFixend){
     //transform the past dates to a new date
     //just change the day/month/year but keep time the same as original
     let endMap = new Date(rangeFixend);
     let startMap = new Date(rangeStart);
     let original = new Date(originalTS)
     let daysDiff = startMap.getTime()-original.getTime();// we have to map the difference dates in the past timeline as in the present timeline.
     //in the next line, we have to see if we are maping dates from more than one day, so we can map them in the present line to without overlapping
     //various days Timestamps in the same actual day!!, so we first comp
     let pastDay =  (endMap.getDate()==original.getDate()) ? false : true;

     //console.log("comparing: ",sortDateFormat(endMap,true)," to ",sortDateFormat(original,true),' map diff: ',pastDay);

     let newTS=sortDateFormat(false,false);// 1st arg to pass a date or create a new actual one, 2nd arg to tell if i want the hour:min:sec
     let d = newTS;

     if(pastDay){
          //here i need to get the date only YY/MM/dd  to add from the difference of fixendDate-daysDiff 
          let newts = new Date(newTS);
          let mapDate = newts.getTime()+daysDiff;
          mapDate = new Date(mapDate);
          newTS = sortDateFormat(mapDate,false);
     }

     newTS = mergeDates(newTS,originalTS);
   // console.log("actual: ",d,"original: ",sortDateFormat(originalTS,true)," merged => ",newTS);
     
     return newTS; 
}

function mergeDates(actual,original){
     const d = new Date(original);
     const fixedSec =(d.getSeconds()<10) ? ("0"+d.getSeconds()) : d.getSeconds();
     const fixedMin=(d.getMinutes()<10) ? ("0"+d.getMinutes()) : d.getMinutes();
     const fixedHour=(d.getHours()<10) ? ("0"+d.getHours()) : d.getHours();

     let frankenstein=actual+' '+fixedHour+':'+fixedMin+':'+fixedSec;;

     return frankenstein;
}

function sortDateFormat(date,time){
     //console.log(" date to format: ",date);
     if(!date){
          let mainDate = new Date();
          let offsetDate = moment.tz(mainDate, "America/Mexico_City").format("YYYY-MM-DD HH:mm:ss");
          var d =  new Date(offsetDate);
     }else{
          var d = new Date(date);
     }
     
     //console.log("AFTER ",d.getDate()+"/"+(d.getMonth()+1)+"/"+d.getFullYear()+"  "+d.getHours()+":"+d.getMinutes()+":"+d.getSeconds());
     let fixedSec =(d.getSeconds()<10) ? ("0"+d.getSeconds()) : d.getSeconds();
     let fixedMon =(d.getMonth()<10) ? ("0"+(d.getMonth()+1)) : (d.getMonth()+1);
     let fixedDay =(d.getDate()<10) ? ("0"+d.getDate()) : d.getDate();
     let fixedMin=(d.getMinutes()<10) ? ("0"+d.getMinutes()) : d.getMinutes();
     let fixedHour=(d.getHours()<10) ? ("0"+d.getHours()) : d.getHours();
     if(time){
          return d.getFullYear()+"-"+fixedMon+"-"+fixedDay+' '+fixedHour+':'+fixedMin+':'+fixedSec;
     }
     return d.getFullYear()+"-"+fixedMon+"-"+fixedDay;
}

async function insertRecord(id,start,end,length){
     start = sortDateFormat(start,true);
     end = sortDateFormat(end,true)
     //console.log("insert record ",id," start: ",start," end: ",end," L: ",length);
    
     const mainQuery = `INSERT 
     INTO temp_sim_dates_record 
     SET start="${start}", end="${end}", simulatedId=${id}, rowsInserted=${length} `;
     
     let con = await sql.connect();
     
     con.query( mainQuery).then( ([rows,fields]) => {// await this promise
          if (rows.length) {
               result = {err:null,success:rows};
               logger.setLog("temp_bot").info("record insert success ");
          }else{
               result = {err:null,success:false};
          }
          con.end()
        })
        .catch((error)=>{//handle error

          logger.setLog("temp_bot").info("insert record query error found");
          logger.setLog("temp_bot").fatal(error);
          result = {err:error,success:null};
        });
}

function smartRangeTS(refTS,lastInsert){
     //here we get the reference of the timestamp of the last sample inserted, and also the insertion timestamp
     //then we check the last time we inserted data, and get the difference from there till today's date
     //and simply just add that difference to the reference timestamp of the last sample inserted to simulate the time flow 
     let todays = new Date();
    
     todays = moment.tz(todays, "America/Mexico_City").format("YYYY-MM-DD HH:mm:ss");
     todays =  new Date(todays); 
     
     lastInsert = (lastInsert) ? new Date(lastInsert) : new Date();
     refTS = new Date(refTS);

     millisDiff = (todays.getTime()-lastInsert.getTime());
     
     let hours = ((millisDiff/1000)/60)/60;
     let endFixedRef = refTS.getTime()+millisDiff;

    // console.log("today ",sortDateFormat(todays,true)," lastRecord ",sortDateFormat(lastInsert,true)," hours diff ",hours);
     //console.log("start ref date ",sortDateFormat(refTS,true)," fixed end date ref : ",sortDateFormat(endFixedRef,true));
     
     return sortDateFormat(endFixedRef,true);
}


module.exports = TempSimulator;

