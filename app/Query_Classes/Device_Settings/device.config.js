const sql = require("../../Data_Base/db.connection");
const logger = require('../../Auxiliary_Classes/logger');

exports.getReport = async() => {
     let mainQuery = `SELECT deviceId,configId,value,pending FROM device_config `+
     `WHERE configId BETWEEN 2 AND 4 `+
     `ORDER by deviceId `;

     let con = await sql.connect();

     await con.query(mainQuery).then( ([rows,fields]) => {// await this promise
      
          if (rows.length) {
               result = {err:null,data:rows};
               //console.table(rows);
          }else{
               result = {err:null,data:false};
          }    
         
          con.end();
     })
     .catch((error)=>{//handle error
          logger.setLog("query").fatal(error);
          result = {err:error,data:null};
     });

     return result;
}