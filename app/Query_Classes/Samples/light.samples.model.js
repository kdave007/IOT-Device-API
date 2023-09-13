const sql = require("../../Data_Base/db.connection");
const logger = require('../../Auxiliary_Classes/logger');

const lightSensors = {};

lightSensors.getSamplesbyDates = async (deviceId,from,to) => {
     let timestampTEST = ["timestamp","insertTimeStamp"];//<-----TEST PURPOSE ONLY
     const mainQuery = `SELECT * FROM device_data_light_sensors WHERE deviceId=${deviceId} AND ${timestampTEST[0]} BETWEEN '${from}' AND '${to}'`;//delete limit
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

module.exports = lightSensors;