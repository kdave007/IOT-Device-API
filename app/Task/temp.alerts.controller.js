const alertsSetUp = require("../Query_Classes/Device_Settings/mail.alerts.model");
const User = require("../Query_Classes/Users/authentication.model");
const tempsProvider = require("../Query_Classes/Samples/get.temps");
const standPoint = require("../Query_Classes/Samples/last.samples.validtaion");
var moment = require('moment-timezone');
const logger = require('../Auxiliary_Classes/logger');

//ADD LOGIC TO EXECUTE WHEN A NEW POST FROM DEVICE HAS BEEN DONE

exports.watchdogRoutine = async() => {
     const user = new User({
          email: null,
          pass: null
     });
     
     const from = '2020-08-18 00:00:00';//testing purpose only
     const tuu = '2020-08-18 23:59:59';//testing purpose only
     var rowsToSend,errorQuery=false;
     let fom,tu;
     var allAlerts = []; 
     
     let uList = await User.getAll();// retrieve list of users
     let setpointRow = await standPoint.getLastTS(1);
     
     //console.log("last standpoint ",setpointRow);
     
     let today = sortDateFormat(false,false);// First Arg is to pass an already existing date or false to get actual date, Second Arg is to get Minutes or not 
     tu = sortDateFormat(false,true);
     
     logger.setLog("alerts").info("--------- Mexico: "+tu);

     if(gotTS(setpointRow.err)){
          fom = (setpointRow.data) ? sortDateFormat(setpointRow.data[0].end,true) :  today+' 00:00:00';
     }else{
          fom= today+' 00:00:00';
     }
     //logger.setLog("alerts").info('fom ',fom,' from ',from,' tu ',tu);
     //console.table(uList.data);

     if(gotAllUsers(uList.err)){
         for(let index=0;index<uList.data.length;index++){
              let temps = null;
              var userInfo = {name:uList.data[index].name,email:uList.data[index].email};
              let aSettings = await alertsSetUp.getAlertsbyUser(uList.data[index].userId);//retrieve alerts set up for every user retrieved before
              //alertSettingsTable(aSettings.data); // pretty table log PRINT

              if(gotAlerts(aSettings.err,uList.data[index].userId)){

                 for(let i=0;i<aSettings.data.length;i++){

                    if(aSettings.data[i].alertType<=4){
                         //console.log("----|| ",uList.data[index].name," Evaluating Alert Type : ",aSettings.data[i].alertType," ||----");
                         if(aSettings.data[i].deviceId==3){
                              temps = await tempsProvider.device3Patch(fom,tu);
                         }else{
                              temps = await tempsProvider.getSortedbyTS(aSettings.data[i].deviceId,fom,tu);//retrieve temps for every deviceId found in the alerts setup
                         }
                         // console.table(temps);
                         if(gotTemps(temps.err)){
                              rowsToSend = evaluateTemps(temps.data,aSettings.data[i],userInfo);
                            //  console.log("rowsto send ",rowsToSend);
                              if(rowsToSend){
                                   allAlerts.push(rowsToSend);
                              }
                              //console.table("alertCondition : ",rowToSend," active ALERT, sending email... ");    
                         }else{
                              errorQuery = true;
                         }
                    }
                  
                }        
               }else{
                    errorQuery = true;
               }
                 
          }
          
     }else{
          errorQuery = true;
     } 
     //console.log("Alerts to send: "); 
     //alertsToSend(allAlerts); 
         // console.log(fom,' - ',tu);
     return {
          error: errorQuery,
          rows : allAlerts,
          range:{
                start:fom,
                end:tu 
               }
          };
     //return {alerts : allAlerts, range:{start:from,end:to}};

};//exports tempsWatchdog END


//ERROR HANDLERS
function gotAllUsers(err){
     //check if we got a successful query 
     if (err) {
               logger.setLog("alerts").error("mail alerts :: error retrieving all Users list");
               return false;
     }else{
          //there is no errors,green flag to next task
          return true;
     }
};

function gotAlerts(err,uId){
     if (err) {
          logger.setLog("alerts").error("mail alerts :: error retrieving userid "+uId+" alerts config list ");
          return false;
}else{
     //there is no errors,green flag to next task
     return true;
}

}

function gotTemps(err){
     if (err) {
          if (err.kind === "not_found") {
               
               logger.setLog("alerts").error(`mail alerts :: USERID =${user} alert List not found`);
               return false;
          } else {
               logger.setLog("alerts").error(`mail alerts :: error retrieving alerts to user ${user}`);
               return false;
          }
     }else{
          //there is no errors,green flag to next task
          return true;
     }
}

function gotTS(err){
     if (err) {
          if (err.kind === "not_found") {
               logger.setLog("alerts").error(`setpoint for today  :: alert List not found`);
               return false;
          } else {
               logger.setLog("alerts").error(`setpoint for today :: error retrieving alerts to user ${user}`);
               return false;
          }
     }else{
          //there is no errors,green flag to next task
          return true;
     }
}


// EVALUATE TEMPS 
function evaluateTemps(temps,alertParams,userInfo){
     //value represents the limit temp
     //value2 represents the min time limit to consider conditions as an alert
     //loweLim represents the low limit when >X< beetween limits condition
     /*
       position [0] = freezer box thermistor
       position [1] = plate thermistor
       position [2] = download thermistor
       position [3] = sucker thermistor
     */
     let thermistorRowIndex = [0,4,3,1,2];

     if(temps){

          var tempRows = temps["temp"+thermistorRowIndex[(alertParams.alertType)]];
          var feloniesArray = [];
          var relatedTempRows = [];
          var setNewTitle=false;
          var  totalMinPeriod = 0;

          for(let i=0;i<tempRows.length;i++){
               if(!i){
                    var  rowTitle = tempRows[i].temp;
               }
               var felonCaught = false;
               console.log("evaluating temp :",tempRows[i].temp);
               console.log("alertParams conditions",alertParams.conditionParam);
               switch(alertParams.conditionParam){
                    case ">=":
                         // console.log(tempRows[i].temp," >= ",alertParams.value," id row: ",alertParams.id,"and time",tempRows[i].period," > ",alertParams.value2);
                              felonCaught = (tempRows[i].temp >= alertParams.value ) ? true : false;
                    break;
                    case "<=":
                         // console.log(tempRows[i].temp," <= ",alertParams.value," id row: ",alertParams.id,"and time",tempRows[i].period," > ",alertParams.value2);
                              felonCaught = (tempRows[i].temp <= alertParams.value ) ? true : false;
     
                    break;
                    case ">x<":
                          //console.log(alertParams.value2," > ",tempRows[i].temp," < ",alertParams.value," id row: ",alertParams.id,"and time",tempRows[i].period," > ",alertParams.value2);
                              felonCaught = ((tempRows[i].temp < alertParams.value) && (tempRows[i].temp > alertParams.lowerLim)) ? false : true;
                    break;
               }
               
               if(felonCaught){
                    //console.log("felon number ",i);
                    
                    rowTitle = (setNewTitle) ? tempRows[i].temp : rowTitle;
                    setNewTitle=false;
                    relatedTempRows.push({
                         belongsTo:rowTitle,
                         temp:tempRows[i]
                    });

                    totalMinPeriod = totalMinPeriod+tempRows[i].period;

               }else{
                    setNewTitle=true;
                    // console.log("summarized :");
                    console.log(relatedTempRows);

                    if(totalMinPeriod > alertParams.value2){
                         //logger.setLog("alerts").info("Related to userId: "+alertParams.userId);
                         //logger.setLog("alerts").info("Sample limit violation!: date ["+tempRows[i].timestamp+"] "+rowTitle+" period(Min.): "+totalMinPeriod);
                         feloniesArray.push({
                              userId:alertParams.userId,
                              deviceId:alertParams.deviceId,
                              type:alertParams.alertType,
                              timePeriod:totalMinPeriod,
                              timeLimit:alertParams.value2,
                              tempLowLim:alertParams.lowerLim,
                              temp:rowTitle,
                              tempLimit:alertParams.value,
                              condition:alertParams.conditionParam,
                              IdSetupViolation:alertParams.id,// alert config Row id violated
                              user:userInfo.name,
                              toEmail:userInfo.email,
                              date:tempRows[i].timestamp,
                              relatedTempRows: relatedTempRows  
                         });   
                    }
                    relatedTempRows = [];
                    totalMinPeriod = 0;
               }

          }

       
          logger.setLog("alerts").info("Alerts checked, inserting and sending email now");
          //console.log(feloniesArray);
          if(feloniesArray.length){
               return feloniesArray;
          }
     }

     return false;
}

function alertSettingsTable(settings){
     if(settings[0]){
          logger.setLog("alerts").info("//////////////// USER ID"+settings[0].userId+" Alerts Settings");
          for(let i=0;i<settings.length;i++){
               logger.setLog("alerts").info(settings[i]);
          }
          console.log("////////////////////////////////////////////");
     }
}

function alertsToSend(alerts){
     if(alerts){
          //console.log("//////////////// USER ID",alerts[0].userId," Alerts Found");
          for(let i=0;i<alerts.length;i++){
               logger.setLog("alerts").info(alerts[i]);
          }
          logger.setLog("alerts").info("////////////////////////////////////////////");
     }
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

