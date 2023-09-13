const sql = require("../../db.connection");
const logger = require('../../../debugg/logger');

const gpios = {};

gpios.insertRow = async (deviceId,data) => {

     var mainQuery = `INSERT INTO device_data_sensor 
                      SET deviceId=${deviceId},
                      sensorData= ${data.value},
                      timestamp=FROM_UNIXTIME(${data.time})`;

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

module.exports = gpios;