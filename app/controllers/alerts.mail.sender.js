const nodeMailer = require('nodemailer');
const standPoint = require("../models/last.samples.validtaion");
const logger = require('../debugg/logger');

var transporter={};

exports.setnSend = (alertsArray) => {
     transporter = nodeMailer.createTransport({
          service:"gmail",
          auth: {
            //user: 'htelemetry.sender1@gmail.com',
           // pass: "atechnik"
            user: 'cool.chain.at@gmail.com',
            pass: '1q2w3e1Q2W3E'
          }
     });
     descomposeandSort(alertsArray.rows,alertsArray.range);   //object.RANGE CHECKED ........ <------------------------------------------------  
}

// verify connection configuration

function sendMail(string,toEmail,name){
     //toEmail = "kevin@atechnik.com.mx";
     string = "\nCoolchain a : "+name+"\nSe detectaron temperaturas fuera de limites deseados:"+string;
     var mailOptions = {
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
     var pastID=null;
     var sendTo = null;var sendToName = null;
     var mssg="";
     var c = 0;
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
     standPoint.setTimeStamp(1,range);//0 : Gpios type.    1 : thermistors type.    UNCOMMENT ----------------------------------------------------
     logger.setLog("alerts").info("alerts.mail.sender :: sort FINISH");
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
          var hours = Math.floor(row.timePeriod / 60)+" Hora(s) ";          
          var minutes = row.timePeriod % 60+" Minuto(s)";
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
