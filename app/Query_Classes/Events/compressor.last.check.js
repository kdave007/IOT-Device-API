const sql = require("../../Data_Base/db.connection");
const logger = require('../../Auxiliary_Classes/logger');

exports.get = async (deviceId) => {
     const mainQuery = `SELECT checkpointDate FROM compressor_last_check WHERE deviceId=${deviceId} ORDER BY insertion DESC LIMIT 1`;

     let con = await sql.connect();
     await con.query( mainQuery).then( ([rows,fields]) => {// await this promise
          result = {err:null,data:(rows.length) ? rows : false};
          con.end()
        })
        .catch((error)=>{//handle error
          logger.setLog("query").fatal(error);
          result = {err:error,data:null};
        });   
      return result;
};

exports.set = async (deviceId,checkPointDate) => {
     const mainQuery = `INSERT INTO compressor_last_check SET deviceId=${deviceId},checkPointDate='${checkPointDate}'`;

     let con = await sql.connect();
     await con.query( mainQuery).then( ([rows,fields]) => {// await this promise
   
       if (rows.affectedRows) {
             result = {err:null,data:rows.affectedRows};
       }else{
             result = {err:null,data:0};
       }
   
       con.end();
     })
     .catch((error)=>{//handle error
        console.log(mainQuery)
         logger.setLog("query").fatal(error);
         result = {err:error,data:0};
     });
     return result
   };