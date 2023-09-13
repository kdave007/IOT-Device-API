const nodeMailer = require('nodemailer');
const standPoint = require("../Query_Classes/Samples/last.samples.validtaion");
const logger = require('../Auxiliary_Classes/logger');
const time = require('../Auxiliary_Classes/date.time');
const fs = require('fs');

let transporter={};
exports.testMail = () => {
     console.log("sending mail ");
     transporter = nodeMailer.createTransport({
          service:"gmail",
          auth: {
            user: 'htelemetry.sender1@gmail.com',
            pass: "atechnik"
          //   user: 'cool.chain.at@gmail.com',
          //   pass: '1q2w3e1Q2W3E'
          }
     });
     toEmail = "kevin@atechnik.com.mx";
     string = "\nCoolchain a : \nSe detectaron temperaturas fuera de limites deseados:";
     let mailOptions = {
          from:"htelemetry.sender1@gmail.com",
          to: toEmail,
          subject:"Alertas Coolchain : Temperatura de sensores",
          text:string
     };
     
     transporter.sendMail(mailOptions ,(error,info) => {
          if(error){
               logger.setLog("alerts").error(error);
          }else{
               logger.setLog("alerts").info("alerts.mail.sender :: mail sent ");
          }
     });
}

exports.setnSendDoors = (alertsArray) => {
     transporter = nodeMailer.createTransport({
          service:"gmail",
          auth: {
            user: 'htelemetry.sender1@gmail.com',
           pass: "atechnik"
          //   user: 'cool.chain.at@gmail.com',
          //   pass: '1q2w3e1Q2W3E'
          }
     });
     let orderbyUsers = sortByUsers(alertsArray);
     console.log(orderbyUsers);
     if(orderbyUsers) sendDoorsAlerts(orderbyUsers);
}

exports.setnSendAlarms = async (alarmsArray) => {
     transporter = nodeMailer.createTransport({
          service:"gmail",
          auth: {
            user: 'htelemetry.sender1@gmail.com',
           pass: "atechnik"
          //   user: 'cool.chain.at@gmail.com',
          //   pass: '1q2w3e1Q2W3E'
          }
     });
    
     let ackRows = null;
     if(alarmsArray){
          console.log(alarmsArray)
          ackRows = await parsenSend(alarmsArray);
     }
     
     return (ackRows!= null && ackRows.length) ? ackRows : false;
}

exports.setnSendThermistors = (alertsArray) => {
     transporter = nodeMailer.createTransport({
          service:"gmail",
          auth: {
            user: 'htelemetry.sender1@gmail.com',
           pass: "atechnik"
          //   user: 'cool.chain.at@gmail.com',
          //   pass: '1q2w3e1Q2W3E'
          }
     });
     descomposeandSort(alertsArray.rows,alertsArray.range);   //object.RANGE CHECKED ........ <------------------------------------------------  
}

exports.setnSendCompressorAlarms = async (messages,userIDs) => {
     if(userIDs.length){
          transporter = nodeMailer.createTransport({
               service:"gmail",
               auth: {
                 user: 'htelemetry.sender1@gmail.com',
                 pass: "atechnik"
               //   user: 'cool.chain.at@gmail.com',
               //   pass: '1q2w3e1Q2W3E'
               }
          });

          for(let i = 0; i < userIDs.length; i++ ){
               let currentId = userIDs[i];
               string = "\nCoolchain a : "+messages["user"+currentId].name+"\n";
               let mailOptions = {
                    from:"htelemetry.sender1@gmail.com",
                    to: messages["user"+currentId].mail,
                    subject:messages["user"+currentId].subject,
                    text:string + messages["user"+currentId].messages
               };
               //if(currentId==2){//TESTING ONLY
                    transporter.sendMail(mailOptions ,(error,info) => {
                         if(error){
                              logger.setLog("alerts").error(error);
                         }else{
                              logger.setLog("alerts").info("alerts.mail.sender :: mail sent ");
                         }
                    }); 
               //}
          }
     }
}

/**
 *   /////////////////////////////////
 *  ///therm alerts functions ///////
 * /////////////////////////////////
 */

function sendMail(string,toEmail,name){
     //toEmail = "kevin@atechnik.com.mx";
     string = "\nCoolchain a : "+name+"\nSe detectaron temperaturas fuera de limites deseados:"+string;
     let mailOptions = {
          from:"htelemetry.sender1@gmail.com",
          to: toEmail,
          subject:"Alertas Coolchain!!",
          text:string
     };
     transporter.sendMail(mailOptions ,(error,info) => {
          if(error){
               logger.setLog("alerts").error(error);
          }else{
               logger.setLog("alerts").info("alerts.mail.sender :: mail sent ");
          }
     }); 
}

function descomposeandSort(alertsRows,range){
     logger.setLog("alerts").info(" alerts.mail.sender :: sorting rows data for email ");
     let pastID=null;
     let sendTo = null;let sendToName = null;
     let mssg="";
     let c = 0;
     for(let i=0;i<alertsRows.length;i++){
          for(let e=0;e<alertsRows[i].length;e++){
              // console.table(alertsRows[i][e]);
               foundNewAddress =(i==0)? false : (alertsRows[i][e].userId==pastID) ? false : true;
               sendTo = (foundNewAddress)? alertsRows[i-1][e].toEmail : alertsRows[i][e].toEmail;
               sendToName = (foundNewAddress)? alertsRows[i-1][e].user : alertsRows[i][e].user;
               theVeryLast = (i==(alertsRows.length-1)) ? (e==(alertsRows[i].length-1))? true : false : false;
               mssg = mssg+formatAlertMssg(alertsRows[i][e]);
          
               if(foundNewAddress || theVeryLast){
                   if((alertsRows[i][e].userId==1)||(alertsRows[i][e].userId==2)){//TESTING, ONLY SEND EMAIL TO USERS ID 1 AND 2------------------------
                    sendMail(mssg,sendTo,sendToName);
                   } 
                   mssg="";
               }
               
               pastID=alertsRows[i][e].userId;
          }
          
     }
     standPoint.setTimeStamp(1,range);//0 : Gpios type.    1 : thermistors type.     logger.setLog("alerts").info("alerts.mail.sender :: sort FINISH");
}

function formatAlertMssg(row){
     let sortedString ="";
     let alertName="";

     switch (row.type){
          case 1:
               alertName="en la caja del camión.";
          break;
          case 2:
               alertName="en la placa eutectica del camión.";
          break;
          case 3:
               alertName="en el tubo de descarga del compresor.";
          break;
          case 4:
               alertName="en el tubo de succión del compresor.";
          break;
     }
     let period =  row.timePeriod+" Minuto(s)";
     if(row.timePeriod>=60){
          let hours = Math.floor(row.timePeriod / 60)+" Hora(s) ";          
          let minutes = row.timePeriod % 60+" Minuto(s)";
          period = hours+minutes;
     }

     let daysInSpanish =["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
     let monthsInSpanish = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre','Diciembre'];
     
     let d = new Date(row.date);
     const fixedSec =(d.getSeconds()<10) ? ("0"+d.getSeconds()) : d.getSeconds();
     const fixedMin=(d.getMinutes()<10) ? ("0"+d.getMinutes()) : d.getMinutes();
     const fixedHour=(d.getHours()<10) ? ("0"+d.getHours()) : d.getHours();

     let dateFormat = daysInSpanish[d.getDay()]+" "+d.getDate()+" de "+monthsInSpanish[d.getMonth()]+" del "+d.getFullYear();
     let timeFormat = fixedHour+':'+fixedMin+':'+fixedSec+' hrs.';

     sortedString = "\n Dispositivo de ID : "+row.deviceId+" , Se encontró una temp. de "+(row.temp.toFixed(2))+"°C "+alertName+" durante "+period+" el "+dateFormat+" a las "+timeFormat;
     
     return sortedString;
}

/**
 *   /////////////////////////////////
 *  ///Doors alerts functions ///////
 * /////////////////////////////////
 */

function sortByUsers(alertsArray){
     let allUsers = [];
     for(let index = 0; index<alertsArray.length; index++){ 
          for(let i = 0; i<alertsArray[index].toUsers.length; i++){
               let userInfo = alertsArray[index].toUsers[i];
          
               let indexfound = allUsers.findIndex(element => element.userInfo.userId == userInfo.userId);
               if(indexfound === -1){
                    //add new user info
                    allUsers.push({
                         userInfo,
                         textInfo:[{
                              device:alertsArray[index].startingPoint.deviceId,
                              message:formatMessage(alertsArray[index])
                         }]
                    });
               }else if(indexfound>=0 && index){
                    allUsers[indexfound].textInfo.push({ 
                         device:alertsArray[index].startingPoint.deviceId,
                         message:formatMessage(alertsArray[index])
                    });
               }
              
          }
          
     }

     return (allUsers.length) ? allUsers : false;
}

function formatMessage(row){ 
     let timestampTEST = ["timestamp","insertTimeStamp"];//test
     let timeString = parseTextDate(row.startingPoint[timestampTEST[0]],row.totalSeconds); 
     return `\nEn la caja enfriadora, se detectó una o más puertas abiertas${timeString}`;
}    

function parseTextDate(date,period){
     period = time.formatTime(period);
     periodString = "";
     if(period.hours>0) periodString = period.hours+" hora(s) ";
     periodString += period.minutes+" minuto(s)";
     periodString += (period.minutes>0 || period.hours>0)? " y "+period.hours+" segundo(s)" : period.hours+" segundo(s)";

     let daysInSpanish =["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
     let monthsInSpanish = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre','Diciembre'];
     
     let d = new Date(date);
     const fixedSec =(d.getSeconds()<10) ? ("0"+d.getSeconds()) : d.getSeconds();
     const fixedMin=(d.getMinutes()<10) ? ("0"+d.getMinutes()) : d.getMinutes();
     const fixedHour=(d.getHours()<10) ? ("0"+d.getHours()) : d.getHours();

     let dateFormat = daysInSpanish[d.getDay()]+" "+d.getDate()+" de "+monthsInSpanish[d.getMonth()]+" del "+d.getFullYear();
     let timeFormat = fixedHour+':'+fixedMin+':'+fixedSec+' hrs.';

     return " durante un lapso de "+periodString+", el "+dateFormat+" a las "+timeFormat;
}

function sendDoorsAlerts(alertsByUser){
     let mailOptions = {
          from:"htelemetry.sender1@gmail.com",
          subject:"Alertas Coolchain : Puertas abiertas",
     };
     let pastDevice = null;let pastUser = null;
     let message =``;

     for(let index = 0; index<alertsByUser.length; index++){
          if(pastUser!=alertsByUser[index].userInfo.userId){
               message =`Coolchain a ${alertsByUser[index].userInfo.name}\n`;
          }

          for(let i = 0; i<alertsByUser[index].textInfo.length; i++){
               let stringHeader = `\nDispositivo ID : ${alertsByUser[index].textInfo[i].device}\n`;
               if(pastDevice==alertsByUser[index].textInfo[i].device){
                    message += alertsByUser[index].textInfo[i].message;
               }else{
                    message += stringHeader+alertsByUser[index].textInfo[i].message;
               }
               pastDevice = alertsByUser[index].textInfo[i].device;
          }
          mailOptions.to = alertsByUser[index].userInfo.email;
          mailOptions.text = message;
          console.log(message);
          transporter.sendMail(mailOptions ,(error,info) => {
               if(error){
                    logger.setLog("alerts").error(error);
               }else{
                    logger.setLog("alerts").info("alerts.mail.sender :: mail sent ");
               }
          });
          pastUser = alertsByUser[index].userInfo.userId;
          pastDevice = null;
     }
           
           
          
     
}

/**
 *   /////////////////////////////////
 *  ///live alarms functions  ///////
 * /////////////////////////////////
 */

async function parsenSend({subscribers,allLogs}){
     let logsSent = [];
     let mailOptions = {
          from:"htelemetry.sender1@gmail.com",
          subject:"Alarmas Coolchain ",
     };
     console.log(subscribers,allLogs);
     for(let index = 0; index<subscribers.length; index++){
          //console.log("subscribers ",subscribers[index].name,subscribers[index].rows)
          let messageBody = "";
          let ackArray = [];
          for(let i = 0; i<subscribers[index].messages.length; i++){
               messageBody+= subscribers[index].messages[i]+"\n";
          }

          ackArray = setAckAlarms(allLogs,subscribers[index].rows);
          allLogs = ackArray.allLogs;

          mailOptions.to = subscribers[index].email;
          mailOptions.text = `Coolchain a ${subscribers[index].name} \n\n`+messageBody;

          //console.log("MESSAGE ",mailOptions.text);
          if(subscribers[index].messages.length){
               await transporter.sendMail(mailOptions ,(error,info) => {
                    if(error){
                         logger.setLog("alarms").error(error);
                    }else{
                         logger.setLog("alarms").info("alarms.mail.sender :: mail sent ");
                    }
               });
          }else{
               console.log("no mssg to send!");
          }
          
          logsSent = [...logsSent,...ackArray.rowsIDs]; 
     }
     
     return logsSent;
}

function setAckAlarms(allLogs,rows){
     let rowsIDs = [];
     for(let index = 0; index<allLogs.length; index++){
          for(let i = 0; i<rows.length; i++){
               if(allLogs[index].rowId == rows[i]){
                    rowsIDs.push(allLogs[index].rowId);
                    allLogs.splice(index,1);
               }
          }
          
     }
     return {allLogs,rowsIDs};
}


/**
 *   /////////////////////////////////////////////////
 *  ///compressor operation alarms functions  ///////
 * /////////////////////////////////////////////////
 */

function parseSubject(missingEvents){
     let messageString = "";
     for(let i = 0; i<missingEvents.length; i++){
          messageString+=` \n `+missingEvents[i];
          console.log("index ",i,' mssg ',missingEvents[i]);
     }
}