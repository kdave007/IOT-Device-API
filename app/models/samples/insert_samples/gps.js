const sql = require("../../db.connection");
const logger = require('../../../debugg/logger');

const gpsData = {};

gpsData.insertRow = async (deviceId,data) => {

     var mainQuery = `INSERT INTO device_data_gps
                      SET deviceId="${deviceId}",
                      latitude= "${data.lat}",
                      longitude="${data.long}",
                      altitude="${data.alt}", 
                      northSouth="${data.nS}",
                      eastWest="${data.eW}",
                      speed="${data.speed}",
                      course="${data.course}",
                      timestamp="${data.timestamp}"`;

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

module.exports = gpsData;