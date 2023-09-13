const sql = require("../../Data_Base/db.connection");

const standpointProv = () => {

};

standpointProv.getLastTS = async (type) => {
     let target = (type == 1) ? "thermistors" : "Gpios"; 
     const mainQuery = `SELECT * 
     FROM last_validation_timestamps 
     WHERE ${target} = '1'
     ORDER BY end DESC
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
          console.log(error);
          result = {err:error,data:null};
        });   
      return result;
};

standpointProv.setTimeStamp= async (type,timestamp) => {
     let target = (type == 1) ? "thermistors" : "Gpios"; 
     const mainQuery = `INSERT 
     INTO last_validation_timestamps 
     SET start="${timestamp.start}", end="${timestamp.end}", ${target}=1 `;
     let con = await sql.connect();
     await con.query( mainQuery).then( ([rows,fields]) => {// await this promise
          console.log("success ",rows);
          if (rows.length) {
               result = {err:null,success:rows};
          }else{
               result = {err:null,success:false};
          }
          con.end()
        })
        .catch((error)=>{//handle error
          console.log(error);
          result = {err:error,success:null};
        });   
      return result; 
};

module.exports = standpointProv;