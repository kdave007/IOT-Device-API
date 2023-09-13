const sql = require("../db.connection");
const time = require('../../controllers/date.time');

// constructor
const VoltagesProvider = function() {};

VoltagesProvider.getBatterySamp = async (deviceId,from,to) => {
     const mainQuery = `SELECT timestamp, voltage
     FROM device_data_temp_volt 
     WHERE DeviceID=${deviceId} AND timestamp 
     BETWEEN '${from}' AND '${to}'`;

     let con = await sql.connect();
     await con.query( mainQuery).then( ([rows,fields]) => {// await this promise
          if (rows.length) {
               rows = formatTS(rows);
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
}

VoltagesProvider.getCompressorSamp = async (deviceId,from,to) => {
     const mainQuery = `SELECT timestamp,sensorData
     FROM device_data_sensor 
     WHERE deviceId=${deviceId} AND timestamp 
     BETWEEN '${from}' AND '${to}'`;
     
     let con = await sql.connect();
     await con.query( mainQuery).then( ([rows,fields]) => {// await this promise
          var cleanData = null;
          console.log('query: ',rows);
          if (rows.length) {
               cleanData = decodeBytes(rows);
          }

          result = {err:null,data:cleanData};
          con.end()
        })
        .catch((error)=>{//handle error
          console.log(error);
          result = {err:error,data:null};
        });   
      return result;
}

function decodeBytes(bytesRows,count){
     var gpioState = [];var sensorValues=[];var pastState=[];
     var count = 0;
     
     for(let index =0;index<bytesRows.length;index++){
          var bytes = bytesRows[index].sensorData;
          count++;

          for(let i=0;i<16;i++){

               if(bytes & (1 << i)){
                    gpioState[i]=0;

                    if(count>1){
                         if(pastState[i]==0){
                              gpioState[i]=null;
                         }   
                    }

                    pastState[i]=0;
               }else{
                    gpioState[i]=1;

                    if(count>1){
                         if(pastState[i]==1){
                              gpioState[i]=null;
                         }
                    }

                    pastState[i]=1;
               }
          }//end core loop

          sensorValues.push({
               "timestamp":time.sortDateFormat(bytesRows[index].timestamp,true),
               "gpio0":gpioState[0],
               "gpio1":gpioState[1],
               "gpio2":gpioState[2],
               "gpio3":gpioState[3],
               "gpio4":gpioState[4],
               "gpio5":gpioState[5],
               "gpio6":gpioState[6],
               "gpio7":gpioState[7],
               "gpio8":gpioState[8],
               "gpio9":gpioState[9],
               "gpio10":gpioState[10],
               "gpio11":gpioState[11],
               "gpio12":gpioState[12],
               "gpio13":gpioState[13],
               "gpio14":gpioState[14],
               "gpio15":gpioState[15]
          });
     }//end top loop
     
     if(sensorValues.length){

          return sensorValues;
     }

     return false;
}

function formatTS(data){
     for(let i=0;i<data.length;i++){
          data[i].timestamp = time.sortDateFormat(data[i].timestamp,true);
     }
     return data;
}

//export class
module.exports = VoltagesProvider;