const express = require('express');
const cronJob = require('node-cron');
const time = require('./app/Auxiliary_Classes/date.time');
const logger = require('./app/Auxiliary_Classes/logger');
const thermWatcher = require('./app/Task/temp.alerts.controller');
const mailNode = require('./app/Task/alerts.mail.sender');
let https = require('https');
let http = require('http');
const doorsWatcher = require('./app/Task/light.sensor.alerts');
const alarms = require('./app/Task/events.alarms');
const compressorMonitor = require('./app/Task/compressor.monitor.controller');
const sleepwalker = require('./app/Task/sleepwalker');

//debugging//
let heapdump = require('heapdump'); //heapdump
let SegfaultHandler = require('segfault-handler'); //SIGSEGV signal handler
let process = require('process');
//-----//
const app = express();

const httpPort = 2525;

app.use(express.json());


cronJob.schedule('*/30 * * * *', async () => { 
     //servers watchdogs
     logger.setLog("server").info("SERVERS SLEEPWALKER ROUTINE CHECK ");
     sleepwalker.watchInterfaceStation();
     sleepwalker.watchDevicesStation();
});

cronJob.schedule('0 * * * *', async () => {    
//cronJob.schedule(' */1 * * * *', async () => {
          try{
               schedule =['00:00:00'];
               
               if(time.scheduleValidationMX(schedule)){
                    logger.setLog("server").info("ALERTS CHECK ");
                    logger.setLog("server").info("Starting Alerts check MEXICO: "+time.sortDateFormat(false,true));
                    //TEMPS CHECK
                    let tAlerts = await thermWatcher.watchdogRoutine();
                    //DOORS CHECK
                    // logger.setLog("server").info("Now cheking door Alerts");
                    // let dAlerts = await doorsWatcher.watchdogRoutine();
                    
                    if(!tAlerts.error){
                         mailNode.setnSendThermistors(tAlerts);
                    }else{
                         logger.setLog("server").info("query alerts watcher error");
                    }
                    //DOORS SEND MAILS
                    mailNode.setnSendDoors(dAlerts);
               }

               logger.setLog("server").info("Finish Alerts CronJob MEXICO: "+time.sortDateFormat(false,true));
          }catch(exception){
               logger.setLog("server").error(exception);
          }
          
});

// ------ Local Test disabled

// cronJob.schedule('*/5 * * * *', async () => {
//      try{
//           logger.setLog("server").info("Checking possible alarms");
//           let alarmsFound = await alarms.watchdogRoutine();
//           if(alarmsFound.error==null){
//                logger.setLog("server").info("Sending mails");
//                let ackRows = await mailNode.setnSendAlarms(alarmsFound.alarms);
//                if(alarmsFound.compEventAfter!=null && alarmsFound.compEventAfter!=undefined){
//                     await alarms.setCompressorOpEvent(alarmsFound.compEventAfter);
//                }
//                await alarms.after(ackRows,alarmsFound.devices);
//           }
//      }catch(exception){
//           logger.setLog("server").error(exception);
//      }
//      logger.setLog("server").info("alarms check finished");
// });

// ------ Local Test disabled

// cronJob.schedule('*/30 * * * *', async () => {//DEVICES COMPRESSOR OPERATIONS CHECK
//      try{
//           logger.setLog("compressor").compressorDate("Checking compressor alarms");
//            let missingEvents = await compressorMonitor.watchdogRoutine();
//            if(missingEvents){
//                let messages = compressorMonitor.parseMessage(missingEvents);
//                //console.log("ALLL",messages);
//                if(messages){
//                     await mailNode.setnSendCompressorAlarms(messages.parsedByUser,messages.usersFound);
//                }
//            }
          
//      }catch(exception){
//           logger.setLog("compressor").error(exception);
//      }
//      logger.setLog("compressor").info("compressor check finished");
// });  

////Segmentation fault crash log////
SegfaultHandler.registerHandler("./logs/SegmentFaultHandlerCrashLog.log"); //Segmentation fault crash log
////heapdump snapshot////
let time = setInterval(function(){ timer() }, (24*60*60*1000));
function timer() {
     heapdump.writeSnapshot('/' + Date.now() + '.heapsnapshot');
     heapdump.writeSnapshot(function (err, filename) {
     });
}
function stopFunction() {
    clearInterval(time);
}
//-----//


let httpServer = http.createServer(app);//TESTING ONLY 
//HTTP
httpServer.listen(httpPort, async() => {
     try{
          logger.setLog("server").info("---------- MEXICO: "+time.sortDateFormat(false,true));
          logger.setLog("server").info("---------- starting server on port "+httpPort);
          logger.setLog("server").info("---------- proecess id "+process.pid);
     }catch(exception){
          logger.setLog("server").error(exception);
     }
    // 
    await sleepwalker.watchInterfaceStation();
    await sleepwalker.watchDevicesStation();
    
});