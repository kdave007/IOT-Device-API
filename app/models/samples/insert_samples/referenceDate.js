const sql = require("../../db.connection");
const logger = require('../../../debugg/logger');

exports.insertRow = async (deviceId,weeksDay,date) => {

     var mainQuery = `INSERT INTO device_date_validation 
                      SET deviceId=${deviceId},
                      date= FROM_UNIXTIME(${date}),
                      weeksDay=${weeksDay}`;

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

