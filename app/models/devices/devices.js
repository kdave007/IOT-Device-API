const sql = require("../../models/db.connection");
const logger = require('../../debugg/logger');
const time = require('../../controllers/date.time');

const devicesProvider ={};

devicesProvider.getIDs = async () => {

     const mainQuery =`SELECT device.DeviceID,device.alias
                    FROM device`;

     let con = await sql.connect();

     await con.query( mainQuery).then( ([rows,fields]) => {// await this promise
          let cleanData = null;
      
          if (rows.length) {
            result = {err:null,data:rows};
          }else{
            result = {err:null,data:false};
          }
         
          
          con.end()
        })
        .catch((error)=>{//handle error

          logger.setLog("query").fatal(error);
          result = {err:error,data:null};
        });

      return result;
};

devicesProvider.getbyMAC = async (macAddress) => {

  const mainQuery =`SELECT deviceId,alias,mac,bssidCreated,gen,apiVersion
                    FROM device
                    WHERE mac='${macAddress}'`;

  let con = await sql.connect();

  await con.query( mainQuery).then( ([rows,fields]) => {// await this promise
       

       if (rows.length) {
         //console.table(rows);
         result = {err:null,data:rows};
       }else{
         result = {err:null,data:false};
       }
      
       
       con.end()
     })
     .catch((error)=>{//handle error

       logger.setLog("query").fatal(error);
       result = {err:error,data:null};
     });

   return result;
};

devicesProvider.getbyEmptyMac = async (BSSID) => {
  const mainQuery =`SELECT deviceId,alias,mac,bssidCreated,gen,apiVersion
                    FROM device
                    WHERE bssidCreated='${BSSID}' AND (mac='' OR mac IS NULL)
                    ORDER BY createdOn DESC	
                    LIMIT 1`;

  let con = await sql.connect();

  await con.query( mainQuery).then( ([rows,fields]) => {// await this promise
    
       if (rows.length) {
         result = {err:null,data:rows};
       }else{
         result = {err:null,data:false};
       }
      
       
       con.end()
     })
     .catch((error)=>{//handle error

       logger.setLog("query").fatal(error);
       result = {err:error,data:null};
     });

   return result;
};

devicesProvider.updateMac = async(deviceId,newMac,apiVer) => {
  const mainQuery =`UPDATE device SET mac ='${newMac}',apiVersion ='${apiVer}' WHERE deviceId = ${deviceId}`;

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

devicesProvider.setLastSeen = async(id) => {

  let lastSeen = time.sortDateFormat(false,true);
  console.log("set last seen ",lastSeen);
  const mainQuery =`UPDATE device SET lastSeen ='${lastSeen}' WHERE deviceId = ${id}`;

  let con = await sql.connect();

  await con.query( mainQuery).then( ([rows,fields]) => {// await this promise
   console.log("set LASTSEEN ",rows);
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

devicesProvider.assignToUser = async (userId,deviceId) => {
  const mainQuery =`INSERT INTO user_device SET userId ='${userId}',deviceId = ${deviceId}`;
  
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


module.exports = devicesProvider;