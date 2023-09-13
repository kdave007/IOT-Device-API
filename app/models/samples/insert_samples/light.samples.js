const sql = require("../../db.connection");
const logger = require('../../../debugg/logger');

const lightSensor = {};

lightSensor.insertRow = async (deviceId,data) => {

     var mainQuery = `INSERT INTO device_data_light_sensors 
                      SET deviceId=${deviceId},
                      module= ${data.moduleCode},
                      timestamp=FROM_UNIXTIME(${data.timestamp}),
                      sensor1=${(data.value1!=undefined) ? data.value1 : null }, 
                      sensor2=${(data.value2!=undefined) ? data.value2 : null}, 
                      sensor3=${(data.value3!=undefined) ? data.value3 : null}, 
                      statusS1=${(data.status1!=undefined) ? data.status1 : null}, 
                      statusS2=${(data.status2!=undefined) ? data.status2 : null}, 
                      statusS3=${(data.status3!=undefined) ? data.status3 : null}, 
                      temp=${data.temp}`;

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

module.exports = lightSensor;