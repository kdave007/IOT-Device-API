const sql = require("../../db.connection");
const logger = require('../../../debugg/logger');

const rtcNPowerBank = {};

rtcNPowerBank.insertRow = async (deviceId,data) => {

     var mainQuery = `INSERT INTO pwr_bank_RTC 
                      SET deviceId=${deviceId},
                      powerBank= ${data.pwrBank},
                      vRTC= ${data.rtc},
                      timestamp=FROM_UNIXTIME(${data.timestamp})`;

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

     return result;
}

module.exports = rtcNPowerBank;