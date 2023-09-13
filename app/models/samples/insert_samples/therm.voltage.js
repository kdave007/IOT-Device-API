const sql = require("../../db.connection");
const logger = require('../../../debugg/logger');

const tempsnVoltage = {};

tempsnVoltage.insertRow = async (deviceId,samplesRow) => {

     var mainQuery = `INSERT INTO device_data_temp_volt 
                  SET deviceId=${deviceId},
                  timestamp=FROM_UNIXTIME(${samplesRow.timestamp}),
                  voltage=${samplesRow.voltage},
                  temp1=${samplesRow.temp1},
                  temp2=${samplesRow.temp2},
                  temp3=${samplesRow.temp3},
                  temp4=${samplesRow.temp4}`;

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

module.exports = tempsnVoltage;