const log4js = require("log4js");
const time = require('./date.time');

let loggerObj ={};
let Log ={};
let logOptions={};

//Static files configurations
log4js.configure({
     appenders: { 
          server: { type: "file", filename: "./logs/server_Main.log"},
          query: { type: "file", filename: "./logs/query.log"},
          pendings: { type: "file", filename: "./logs/pendings.log"},
          debug: { type: "file", filename: "./logs/debug.log"},
          compressor: { type: "file", filename: "./logs/compressor.log"}
},
     categories: { 
          default: { appenders: ['server'], level: 'all' },
          query: { appenders: ['query'], level: 'all' },
          pendings: { appenders: ['pendings'], level: 'all' },
          debug: { appenders: ['debug'], level: 'all' },
          compressor: { appenders: ['compressor'], level: 'all' }
     }
});

//Log selector *public Method
Log.setLog = (appender) => {
      loggerObj = log4js.getLogger(appender);
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

logOptions.debugDate = (info) => {
     info = (info==undefined) ? "" : info;
     loggerObj.debug("MX Time Zone : [",time.sortDateFormat(false,true),"] ",info);
}

logOptions.debugNC = (info) => {
     loggerObj.debug(info);
}

logOptions.compressorDate = (info) => {
     info = (info==undefined) ? "" : info;
     loggerObj.info("MX Time Zone : [",time.sortDateFormat(false,true),"] ",info);
}

logOptions.compressor = (info) => {
     loggerObj.info(info);
}

module.exports = Log;


