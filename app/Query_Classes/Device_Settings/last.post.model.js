const sql = require("../../Data_Base/db.connection");
const logger = require('../../Auxiliary_Classes/logger');

exports.getRecentIDs = async () => {
     const mainQuery = `SELECT deviceId FROM device_latest_post WHERE pendingWatchdog=1 AND pendingAlarms=1 ORDER BY deviceId;`;

     let con = await sql.connect();
     await con.query( mainQuery).then( ([rows,fields]) => {// await this promise
          result = {err:null,data:rows};
          con.end()
        })
        .catch((error)=>{//handle error
          logger.setLog("query").fatal(error);
          result = {err:error,data:null};
        });   
      return result;
};

exports.setAck = async (deviceId) => {
  const mainQuery = `UPDATE device_latest_post SET pendingWatchdog=0,pendingAlarms=0 WHERE deviceId = ${deviceId}`;
console.log(mainQuery)
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
      logger.setLog("query").fatal(error);
      result = {err:error,data:0};
  });
  return result
};