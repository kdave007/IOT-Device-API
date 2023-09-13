const sql = require("../../models/db.connection");
const logger = require('../../debugg/logger');
const time = require('../../controllers/date.time');

const AlertsDetected ={};

AlertsDetected.getNotifications = async (deviceId,userId) => {
    
     const mainQuery = `SELECT period,sampleValue,timestamp,seen,id,type  
     FROM alerts_detected
     WHERE deviceId=${deviceId} AND relatedUserId =${userId}`;

     let con = await sql.connect();
     
     await con.query( mainQuery).then( ([rows,fields]) => {// await this promise
          if (rows.length) {
               data = formatDate(rows);
               result = {err:null,data:data};
               logger.setLog("server").info("Notifications requested successfully");
          }else{// zero rows
               result = {err:null,data:false};
          }
          
          con.end()
        })
        .catch((error)=>{//handle error
          logger.setLog("query").fatal(error);
          result = {err:error,data:null};
        });   
      return result;
}

function formatDate(rows){
     for(let i=0;i<rows.length;i++){
          rows[i].timestamp = time.sortDateFormat(rows[i].timestamp,true);
     }

     return rows;
}

module.exports = AlertsDetected;