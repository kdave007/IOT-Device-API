const sql = require("../../Data_Base/db.connection");
const logger = require('../../Auxiliary_Classes/logger');

exports.findSubscribers = async(deviceId) => {
     const mainQuery = `SELECT user.userId,liveEventId,name,email
     FROM live_event_subscribers
     RIGHT JOIN user 
     ON live_event_subscribers.userId = user.userId
     WHERE deviceId=${deviceId} ORDER BY user.userId AND liveEventId;`;

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
}