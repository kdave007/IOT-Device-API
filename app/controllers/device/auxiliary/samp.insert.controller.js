const logger = require('../../../debugg/logger');
const states = require('../../../module/states.machine.client');
const lModIn = require('../../../models/samples/insert_samples/light.samples');
const gpsIn = require('../../../models/samples/insert_samples/gps');
const gpioIn = require('../../../models/samples/insert_samples/gpios');
const tempVIn = require('../../../models/samples/insert_samples/therm.voltage');
const eventIn = require('../../../models/samples/insert_samples/events');
const powBankIn = require('../../../models/samples/insert_samples/power.bank');
const serverLogIn = require('../../../models/samples/insert_samples/server.log');
const moment = require('moment-timezone');
const time = require('../../date.time');


exports.lightMod = async(deviceId,sampJson) => {
     var error =null;
     var totalRowsAffected = 0;
     var data = {
          moduleCode:null,
          timestamp:null,
          temp:null
     }; 
    
     for(let i=0;i<sampJson.length;i++){
               try{
                     
                    data.moduleCode=sampJson[i]["MOD"];
                    data.timestamp=sampJson[i]["TIME"];
                    data.temp= sampJson[i]["TEMP"];//EPOCH
                    
                    for(let c=0;c< sampJson[i]["SENS"].length;c++){
                         let index = c+1;
                         data["value"+index]= sampJson[i]["SENS"][c]["V"];
                         data["status"+index]= (sampJson[i]["SENS"][c]["S"]) ? 1 : 0;
                    
                    }
                    // console.log("SENS ",sampJson[i]["SENS"]);
                    // console.log("DATA ",data);
                    let rowsA = await lModIn.insertRow(deviceId,data);

                    if(rowsA.err==null){
                         totalRowsAffected+=rowsA.data;
                    }else{
                         error = "JSON ERROR Encode : Light Mod";
                    }
                    

               }catch(e){
                    logger.setLog("server").fatal(e);
                    logger.setLog("pendings").fatal(e);
                    error = "JSON ERROR Encode : Light Mod";
                    i=sampJson.length;
               }
              
          }
     
     return {error: error,rows: totalRowsAffected};
};

exports.gps = async(deviceId,sampJson)  => {
     var error =null;
     var totalRowsAffected = 0;
     var data = {
          lat:null,
          long:null,
          alt:null,
          nS:null,
          eW:null,
          speed:null,
          course:null,
          date:null,
          time:null
     }; 

     for(let i=0;i<sampJson.length;i++){
          try{

               let timeDate = formatGPSdate(sampJson[i]["DATE"],sampJson[i]["TIME"]);
          
               data = {
                    lat:sampJson[i]["LATITUDE"],
                    long:sampJson[i]["LONGITUDE"],
                    alt:sampJson[i]["ALT"],
                    nS:sampJson[i]["N/S"],
                    eW:sampJson[i]["E/W"],
                    speed:sampJson[i]["SPEED"],
                    course:sampJson[i]["COURSE"],
                    timestamp: timeDate
               }; 

               let rowsA = await gpsIn.insertRow(deviceId,data);

               if(rowsA.err==null){
                    totalRowsAffected+=rowsA.data;
               }else{
                    error = "JSON ERROR Encode : GPS";
               }

          }catch(e){
               logger.setLog("server").fatal(e);
               logger.setLog("pendings").fatal(e);
               error = "JSON ERROR Encode : GPS";
               i=sampJson.length;
          }
     }
     
     return {error: error,rows: totalRowsAffected};
};

exports.gpio = async(deviceId,sampJson)  => {
     var error =null;
     var totalRowsAffected = 0;
     var data = {
          time:null,
          value:null
     }; 
     
     for(let i=0;i<sampJson.length;i++){
          try{
               data = {
                    time:sampJson[i]["TIME"],
                    value:sampJson[i]["VAL"]
               };

               let rowsA = await gpioIn.insertRow(deviceId,data);

               if(rowsA.err==null){
                    totalRowsAffected+=rowsA.data;
               }else{
                    error = "JSON ERROR Encode : GPIO'S";
               }

          }catch(e){
               logger.setLog("server").fatal(e);
               logger.setLog("pendings").fatal(e);
               error = "JSON ERROR Encode : GPIO'S";
               i=sampJson.length;
          }
     }
     
     return {error: error,rows: totalRowsAffected};
};

exports.tempsnVoltage = async(deviceId,sampJson)  => {
     var error =null;
     var totalRowsAffected = 0;
     var data = {
          timestamp:null,
          temp1:null,
          temp2:null,
          temp3:null,
          temp4:null
     }; 

     for(let i=0;i<sampJson.length;i++){
          try{
               data = {
                    timestamp:sampJson[i]["TIME"],
                    voltage:sampJson[i]["TRUCK-V"],
                    temp1:(sampJson[i]["SENS"] == null) ? null : sampJson[i]["SENS"][0],
                    temp2:(sampJson[i]["SENS"] == null) ? null : sampJson[i]["SENS"][1],
                    temp3:(sampJson[i]["SENS"] == null) ? null : sampJson[i]["SENS"][2],
                    temp4:(sampJson[i]["SENS"] == null) ? null : sampJson[i]["SENS"][3]
               }; 

               let rowsA = await tempVIn.insertRow(deviceId,data);

               if(rowsA.err==null){
                    totalRowsAffected+=rowsA.data;
               }else{
                    error = "JSON ERROR Encode : TEMP";
               }

          }catch(e){
               logger.setLog("server").fatal(e);
               logger.setLog("pendings").fatal(e);
               error = "JSON ERROR Encode : TEMP";
               i=sampJson.length;
          }
     }
     
     return {error: error,rows: totalRowsAffected};
};

exports.event = async(deviceId,sampJson)  => {
     var error =null;
     var totalRowsAffected = 0;
     let live = 0
     let normal = 0;

     var data = {
          level:null,
          code:null,
          content:null,
          timestamp:null
     };

     for(let i=0;i<sampJson.length;i++){
          try{
               var data = {
                    level:(sampJson[i]["LEVEL"]==undefined || sampJson[i]["LEVEL"]==0) ? sampJson[i]["TYPE"] : sampJson[i]["LEVEL"],
                    code:sampJson[i]["CODE"],
                    content:sampJson[i]["CONTENT"],
                    timestamp:sampJson[i]["TIME"]
               };
               console.log("ROW RECEIVED ",sampJson[i]);

               if(sampJson[i]["LEVEL"]==5 || sampJson[i]["TYPE"]==5){
                    //level 5 it's a real time event / live event
                    console.log("case 1") 
                    var rowsA = await eventIn.insertRowLive(deviceId,data);
                    await eventIn.setLatestPost(deviceId);
               }else{
                    console.log("case 2")
                    var rowsA = await eventIn.insertRowNormal(deviceId,data);
               }
               

               if(rowsA.err==null){
                    totalRowsAffected+=rowsA.data;

                    if(sampJson[i]["LEVEL"]==5 || sampJson[i]["TYPE"]==5){
                         live++;
                    }else{
                         normal++;
                    }

               }else{
                    error = "JSON ERROR Encode : EVENT";
               }

          }catch(e){
               logger.setLog("server").fatal(e);
               logger.setLog("pendings").fatal(e);
               error = "JSON ERROR Encode : EVENT";
               i=sampJson.length;
          }
     }

     return {error: error,rows: totalRowsAffected, extraParams : {live,normal}};
};

exports.powerBank = async(deviceId,sampJson)  => {
     var error =null;
     var totalRowsAffected = 0;
     var data = {
          pwrBank:null,
          rtc:null,
          timestamp:null
     };

     for(let i=0;i<sampJson.length;i++){
          try{
               var data = {
                    pwrBank:sampJson[i]["POWERBANK"],
                    rtc:sampJson[i]["RTC"],
                    timestamp:sampJson[i]["TIME"]
               };

               let rowsA = await powBankIn.insertRow(deviceId,data);

               if(rowsA.err==null){
                    totalRowsAffected+=rowsA.data;
               }else{
                    error = "JSON ERROR Encode : Power Bank";
               }

          }catch(e){
               logger.setLog("server").fatal(e);
               logger.setLog("pendings").fatal(e);
               error = "JSON ERROR Encode : Power Bank";
               i=sampJson.length;
          }
     }
     
     return {error: error,rows: totalRowsAffected};
};

exports.serverLog = async(deviceId,string)  => {

     await serverLogIn.insertRow(deviceId,string);

};

function formatGPSdate(dateSt,timeSt){
     try{
               let t = time.sortDateFormat(false,false);

               let actualDate = new Date (t);
               const getYear = actualDate.getFullYear();
               const subYear = (""+getYear).substring(0,2);
               var year        = (subYear+dateSt).substring(0,4);
               var month       = (subYear+dateSt).substring(5,6);
               var day         = (subYear+dateSt).substring(6,8);
               var date        = new Date(year, month-1, day);
               date = time.sortDateFormat(date,false);

               var hours        = (timeSt).substring(0,2);
               var min       = (timeSt).substring(2,4);
               var sec         = (timeSt).substring(4,6);
               
               return  date+" "+hours+":"+min+":"+sec;
     }catch (e){
          logger.setLog("server").error("samp insert controller :: couldn't Parse time and date of GPS DATA, replacing with actual date ");
          let act = time.sortDateFormat(false,true);
          logger.setLog("server").error(act);

          return act;
     }
}