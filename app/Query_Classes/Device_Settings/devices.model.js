const sql = require("../../Data_Base/db.connection");
const logger = require('../../Auxiliary_Classes/logger');

const devices = {};

devices.getActive = async () => {
     let con = await sql.connect();
     const mainQuery = `SELECT * FROM device WHERE mac IS NOT NULL AND mac !='';`;
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

module.exports = devices;