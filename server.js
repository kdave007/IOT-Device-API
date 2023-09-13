const express = require('express');
//const session = require('express-session');  
const morgan = require('morgan');
const uuid = require('uuid/v4');
const cronJob = require('node-cron')
const userAuth = require('./app/controllers/auth.controller');
const allocator = require('./app/module/commands.controller.module');
const alertsWatcher = require('./app/controllers/mail.alerts.controller');
const mailNode = require('./app/controllers/alerts.mail.sender');
const TempSimulator = require('./app/debugg/temps.simulator');
const time = require('./app/controllers/date.time');
const voltsProv = require('./app/controllers/samples/voltage.samples');
//const FileStore = require('session-file-store')(session);
const logger = require('./app/debugg/logger');
const defrosting = require('./app/controllers/defrosting/defrosting.controller');
let https = require('https');
let http = require('http');
let fs = require('fs');
/////***** commnet next lines for a local server test--- 

let privateKey  = fs.readFileSync('./SSL/privateKey.pem', 'utf8');
let certificate = fs.readFileSync('./SSL/certificate.crt', 'utf8');
let CA = fs.readFileSync('./SSL/certificateCA.crt', 'utf8');
let credentials = {key: privateKey, cert: certificate,ca: CA};

  ///debugging lib//
let heapdump = require('heapdump'); //heapdump
let process = require('process');

////****

const alertsView = require('./app/controllers/notifications/alert.notifications');
const bodyParser = require('body-parser');
const configPost = require('./app/controllers/device/config.response');
const dataReceived = require('./app/controllers/device/data.received');
const ota = require('./app/controllers/device/ota.provider');



const app = express(); 

//server settings
const httpsPort = 8443;
const httpPort = 8080;
//app.set('port',port);


//MIDDLEWARES  ****************************************
// app.use(session({
//      genid: (req) => {//if client req doesnt have a ssid, we generate a new one
//        console.log('Inside the session middleware');
//        console.log(req.sessionID);
//        return uuid() // use UUIDs for session IDs
//      },
//      store: new FileStore(),//we store the ssid 
//      secret: 'keyboard cat',
//      resave: false,
//      saveUninitialized: true
// }));

     app.use((req, res, next) =>{
          console.log("req headers preview",req.headers);
          try{
               console.log("req preview",req.body)
          }catch{
               console.log("error"+req.body)
          }
          next();
     });
     
     //app.use(require('body-parser').json()); 
     app.use(require('body-parser').urlencoded({ extended: true }));
     app.use(bodyParser.text());
     app.use(express.json());// read post json <----------------------------- check
     app.use(morgan('dev'));
     app.use((req, res, next) => {
          //SETTING RESPONSE HEADERS
     res.header('Access-Control-Allow-Origin', '*')
     res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS')
      res.header('Access-Control-Allow-Credentials', true)
         res.header('Access-Control-Allow-Headers', '*');
          next();
     });


     //SESSION HANDLER**************************************

     app.get('/',(req,res) => {
          logger.setLog("server").info("redirecting");
          res.redirect('../index.html');
     });

     //POST HANDLERS ************************************
     app.post('/server',async(req,res) => {    
          // userAuth.validate(req,res,(denied,allowed)=>{//here we validate the user credentials
          //      if (denied) {
          //           //end request
          //           logger.setLog("server").info("auth access denied");  
          //      }else if(allowed){
          //           logger.setLog("server").info("auth access guaranteed");
          //           //proceed to original request
          //           allocator.taskAllocator(req,res);
               
          //      }
          // });
          
     });

     app.post('/CONFIGS',async(req,res) => {
          logger.setLog("server").info(" [LOG] CONFIGS PATH ----------timezone MEXICO: "+time.sortDateFormat(false,true));
          console.log(`NEW POST Headers :`);
          console.log(req.headers);
          console.log(`NEW POST Body :`);
          console.log(req.body);
          try{ 
               let client = (req.headers["client"]!=undefined) ? req.headers["client"] : false;
               let bssid = (req.headers["bssid"]!=undefined) ? req.headers["bssid"] : false;
               let key = (req.headers["key"]!=undefined) ? req.headers["key"] : false;
               let sdk = (req.headers["sdk"]!=undefined) ? req.headers["sdk"] : false;
               let version = (req.headers["version"]!=undefined) ? req.headers["version"] : false;
               let iface = (req.headers["iface"]!=undefined) ? req.headers["iface"] : false;
               let configs = (req.headers["configs"]!=undefined) ? req.headers["configs"] : false;
               let refDay = (req.headers["day"]!=undefined) ? req.headers["day"] : false;
               let refEPOCH = (req.headers["epoch"]!=undefined) ? req.headers["epoch"] : false;
               console.log("CONFIGS ",configs);
          // let reqBody = JSON.parse(req.body);
               let params = {mac:client,bssid,key,sdk,version,iface,configs,refDay,refEPOCH};
               
               console.log("NEW POST Params extracted:");
               console.log(params);
          
          if(client!=null && client!=undefined){
               await configPost.getUpdate(params,res);
          }else{
               logger.setLog('server').error("[LOG] Couldn't extract client/mac parameter from Headers");
          } 

          }catch(exception){
               logger.setLog("server").error("[LOG] "+exception);
          }     
          
     });

     app.post('/DATA',async(req,res) => {
          logger.setLog("server").info("[LOG] DATA PATH ----------timezone MEXICO: "+time.sortDateFormat(false,true));
          console.log(`DATA NEW POST Headers :`);
          console.log(req.headers);
          console.log(`DATA NEW POST Body :`);
          console.log(req.body);
          try{ 
               let client = (req.headers["client"]!=undefined) ? req.headers["client"] : false;
               let bssid = (req.headers["bssid"]!=undefined) ? req.headers["bssid"] : false;
               let key = (req.headers["key"]!=undefined) ? req.headers["key"] : false;
               let sdk = (req.headers["sdk"]!=undefined) ? req.headers["sdk"] : false;
               let version = (req.headers["version"]!=undefined) ? req.headers["version"] : false;
               let iface = (req.headers["iface"]!=undefined) ? req.headers["iface"] : false;
               let configs = (req.headers["configs"]!=undefined) ? req.headers["configs"] : false;

               let params = {mac:client,bssid:bssid,key:key,sdk:sdk,version:version,iface:iface,configs:configs};
               
               console.log("DATA NEW POST Params extracted:");
               console.log(params);
          
          if(client){
               
               if(req.body){
                    await dataReceived.parser(params,req.body,res);
               }else{
                    logger.setLog('server').error("DATA Couldn't extract request body.");
               }

          }else{
               logger.setLog('server').error("DATA Couldn't extract client/mac parameter from Headers");
          } 

          }catch(exception){
               logger.setLog("server").error(exception);
          }

     });

     app.post('/OTA',async(req,res) => {
          logger.setLog("server").info("[LOG] OTA PATH ----------timezone MEXICO: "+time.sortDateFormat(false,true));
          console.log(`OTA NEW POST Headers :`);
          console.log(req.headers);
          console.log(`OTA NEW POST Body :`);
          console.log(req.body);
          try{ 
               let client = (req.headers["client"]!=undefined) ? req.headers["client"] : false;
               let bssid = (req.headers["bssid"]!=undefined) ? req.headers["bssid"] : false;
               let key = (req.headers["key"]!=undefined) ? req.headers["key"] : false;
               let sdk = (req.headers["sdk"]!=undefined) ? req.headers["sdk"] : false;
               let version = (req.headers["version"]!=undefined) ? req.headers["version"] : false;
               let iface = (req.headers["iface"]!=undefined) ? req.headers["iface"] : false;
               let configs = (req.headers["configs"]!=undefined) ? req.headers["configs"] : false;

               let params = {mac:client,bssid:bssid,key:key,sdk:sdk,version:version,iface:iface,configs:configs};
               
               console.log("NEW POST Params extracted:");
               console.log(params);
          
          if(client){
               
               if(req.body){
                    await ota.get(params,res);
               }else{
                    logger.setLog('server').error("Couldn't extract request body.");
               }

          }else{
               logger.setLog('server').error("Couldn't extract client/mac parameter from Headers");
          } 

          }catch(exception){
               logger.setLog("server").error(exception);
          }
          
     });

     app.post('/alerts',async(req,res) => {
          try{
               console.log('Alerts Notifications Requested');
               let rows =  await alertsView.alertNotifications(req.device,req.user);
               
               res.send(rows);
          }catch(e){
               logger.setLog('server').error(e);
          }
     });

     cronJob.schedule('*/1 * * * *', async () =>{//testin compressor settings when no compressor setup is present, TO DO :
          // let result = await require('./app/controllers/device/compressor.settings').getAll(31);
          // console.log(result);
     // //cronJob.schedule(' */5 * * * *', async () => {
     //      try{
     //           schedule =['11:00:00','23:00:00'];
                    
     //           if(time.scheduleValidationMX(schedule)){
     //                     logger.setLog("server").info("Temps sim bot START");
     //                     logger.setLog("server").info("Starting Temps sim bot MEXICO: "+time.sortDateFormat(false,true));
     //                     await TempSimulator.start();
     //                     logger.setLog("server").info("Finish Temps Simulation CronJob MEXICO: "+time.sortDateFormat(false,true));
     //                }
     //      }catch(exception){
     //           logger.setLog("server").error(exception);
     //      }
  
     });

     app.post('/tester',async(req,res) => {
          logger.setLog("server").info("----------timezone MEXICO: "+time.sortDateFormat(false,true));
          console.log("POST// test request body:",req.body);
          console.log("POST// test request headers (prettyfied):");
          console.log(JSON.stringify(req.headers));
          console.log("POST// test request headers:",req.headers);
          try{
               logger.setLog('server').info('POST// Test request received');
               
               res.send("hello, this is devices CoolChain server!, this a POST response.")
               res.status(200).end();
          }catch(e){
               logger.setLog('server').error(e);
          }
     });

     app.get('/tester',async(req,res) => {
          console.log("GET// test request received",req.body)
          try{
               logger.setLog('server').info('GET// Test request received');
               res.send("hello, this is CoolChain server!")
               res.status(200).end();
          }catch(e){
               logger.setLog('server').error(e);
          }
     });

///******* comment next lines to test local server

 ////heapdump snapshot////
let tiempo = setInterval(function(){ timerHS() }, (12*60*60*1000));
function timerHS() {
     heapdump.writeSnapshot('/' + Date.now() + '.heapsnapshot');
     heapdump.writeSnapshot(function (err, filename) {
     });
}
function stopFunction() {
    clearInterval(tiempo);
}
//---

//START SERVER ************************ 

let httpsServer = https.createServer(credentials,app);
//HTTPS
httpsServer.listen(httpsPort,() => {
     try{
          logger.setLog("server").info("---------- MEXICO: "+time.sortDateFormat(false,true));
          logger.setLog("server").info("---------- starting server on port "+httpsPort);
          logger.setLog("server").info("---------- process id "+process.pid);

     }catch(exception){
          logger.setLog("server").error(exception);
     }
});

////**** 

let httpServer = http.createServer(app);//TESTING ONLY 
//HTTP
httpServer.listen(httpPort,() => {
     try{
          logger.setLog("server").info("----------timezone MEXICO: "+time.sortDateFormat(false,true));
          logger.setLog("server").info("----------ver 3.0.2 starting server on port "+httpPort);

     }catch(exception){
          logger.setLog("server").error(exception);
     }
    // 
});








