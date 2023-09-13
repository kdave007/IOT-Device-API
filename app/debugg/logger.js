const log4js = require("log4js");
const time = require('../controllers/date.time');

let loggerObj ={};
let Log ={};
let logOptions={};

//Static files configurations
log4js.configure({
     appenders: { 
          server: { type: "multiFile", base: "./logs/", property:'categoryName', extension:'.log' },
          temp_bot: { type: "multiFile", base: "./logs/", property:'categoryName', extension:'.log'},
          alerts: { type: "multiFile", base: "./logs/", property:'categoryName', extension:'.log'},
          query: { type: "multiFile", base: "./logs/", property:'categoryName', extension:'.log'},
          pendings: { type: "multiFile", base: "./logs/", property:'categoryName', extension:'.log'},
          testing: { type: "multiFile", base: "./logs/", property:'categoryName', extension:'.log'}
},
     categories: { 
          default: { appenders: ['server'], level: 'all' },
          temp_bot: { appenders: ['temp_bot'], level: 'all' },
          alerts: { appenders: ['alerts'], level: 'all' },
          query: { appenders: ['query'], level: 'all' },
          pendings: { appenders: ['pendings'], level: 'all' },
          testing: { appenders: ['testing'], level: 'all' }
     }
});

//Log selector *public Method
Log.setLog = (appender) => {
      let dateName = currentDateLogName();
      loggerObj = log4js.getLogger(appender+dateName);
      return logOptions;
}



//*Public Logging Methods
logOptions.info = (info) => {
     loggerObj.info(info);
     console.log(info);
}

logOptions.infoNC = (info) => {
     loggerObj.info(info);
}

logOptions.error = (info) => {
     loggerObj.error("MX Time Zone : [",time.sortDateFormat(false,true),"]");
     loggerObj.error(info);
     console.log(info);
}

logOptions.errorNC = (info) => {
     loggerObj.error("MX Time Zone : [",time.sortDateFormat(false,true),"]");
     loggerObj.error(info);
}

logOptions.fatal = (info) => {
     loggerObj.fatal("MX Time Zone : [",time.sortDateFormat(false,true),"]");
     loggerObj.fatal(info);
     console.log(info);
}

logOptions.fatalNC = (info) => {
     loggerObj.fatal("MX Time Zone : [",time.sortDateFormat(false,true),"]");
     loggerObj.fatal(info);
}

logOptions.debug = (info) => {
     loggerObj.debug(info);
     console.log(info);
}

logOptions.debugNC = (info) => {
     loggerObj.debug(info);
}

logOptions.testing = (info)=> {
     loggerObj.info("MX Time Zone : [",time.sortDateFormat(false,true),"]");
     loggerObj.info(info);
}

logOptions.dateMx = (info) => {
     console.log("MX Time Zone : [",time.sortDateFormat(false,true),"]",info);
}

function currentDateLogName(){
     return "__"+time.sortDateFormat(false,false);
}

module.exports = Log;