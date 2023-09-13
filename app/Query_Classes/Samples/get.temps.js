const sql = require("../../Data_Base/db.connection");
const logger = require('../../Auxiliary_Classes/logger');

// constructor
const TempsProvider = function(device) {
     this.deviceId = device.id;
};

//get by DATES RANGE
TempsProvider.getTempsbyDatesRange = (deviceId,from,to,response) => {
     const mainQuery = `SELECT timestamp, temp1, temp2, temp3, temp4 
     FROM device_data_temp_volt 
     WHERE DeviceID=${deviceId} AND timestamp 
     BETWEEN '${from}' AND '${to}'`;

     sql.query(mainQuery, (err, answer) => {
          if (err) {
               logger.setLog("query").fatal(error);
               response(err, null);
               return;
          }
          if (answer.length) {
               let cleanData = cleanNULLS(answer);
               response(null, cleanData);
               return;
          }
          // not found User
          response({ kind: "not_found" }, null);   
     });

};

TempsProvider.getSortedbyTS = async (deviceId,from,to) => {
     const mainQuery = `SELECT timestamp, temp1, temp2, temp3, temp4 
     FROM device_data_temp_volt 
     WHERE DeviceID=${deviceId} AND timestamp 
     BETWEEN '${from}' AND '${to}'`;

     console.log("tempsProv :: ID:",deviceId," get temps from : ",from," To: ",to);

     let con = await sql.connect();
     await con.query( mainQuery).then( ([rows,fields]) => {// await this promise
          let cleanData = null;
          if (rows.length) {
              cleanData = sortTimeStamps(cleanNULLS(rows));
          }
          result = {err:null,data:cleanData};
          con.end()
        })
        .catch((error)=>{//handle error
          logger.setLog("query").fatal(error);
          result = {err:error,data:null};
        });   
      return result;
};


TempsProvider.getNormalSort = async (deviceId,from,to) => {
     const mainQuery = `SELECT timestamp, temp1, temp2, temp3, temp4 
     FROM device_data_temp_volt 
     WHERE DeviceID=${deviceId} AND timestamp 
     BETWEEN '${from}' AND '${to}'`;

     let con = await sql.connect();
     await con.query( mainQuery).then( ([rows,fields]) => {// await this promise
          let cleanData = null;
          if (rows.length) {
              cleanData = (cleanNULLS(rows));
          }
          result = {err:null,data:cleanData};
          con.end()
        })
        .catch((error)=>{//handle error
          logger.setLog("query").fatal(error);
          result = {err:error,data:null};
        });   
      return result;
};

//when we found some temp like -100, we are at the limit sensing value, we need to clean it
function cleanNULLS(data){
       for(let index=0; index<data.length;index++){
          for(let i = 1; i<5;i++){
               data[index]["temp"+i] = (data[index]["temp"+i] <= (-44.0)) ? (-43.5) :  data[index]["temp"+i];
         }
       }  
     return data;
}
 
function sortTimeStamps(dataArray){
     var indexShift=[];
     var sortedA ={
          temp1:[],
          temp2:[],
          temp3:[],
          temp4:[]
     };
     for(let index=0;index<dataArray.length;index++) {
          if(index>0){
               for(let i=0;i<4;i++){
                    //console.log("dataArray indexSHIFT get.temps ",dataArray[indexShift[i]]["temp"+(i+1)]);
                    saveEndPoint = ( dataArray[index]["temp"+(i+1)] == dataArray[indexShift[i]]["temp"+(i+1)] ) ? false : true;       
                    if(saveEndPoint){
                         sortedA["temp"+(i+1)].push({
                              temp : dataArray[indexShift[i]]["temp"+(i+1)],
                              period : timeDifference(dataArray[indexShift[i]].timestamp,dataArray[index].timestamp,"m"),// m=minutes s=seconds
                              timestamp:dataArray[indexShift[i]].timestamp
                         });
                         indexShift[i]= index;
                    }       
               }
          }else{
               for(let c=0;c<4;c++){
                    indexShift[c]= index;
               }
          }
          
     }
     return sortedA;
}


function timeDifference(start,end,conv){
     let dateS = new Date(start);
     let dateE = new Date(end);
     var difference = dateE.getTime()-dateS.getTime();
     difference = (conv=="m") ? Math.floor(difference/1000/60) : Math.floor(difference/1000) ;
     return difference;
}

TempsProvider.device3Patch = async (from,to) => {
     const mainQuery = `SELECT dateTime as timestamp, temp1, temp2, temp3, temp4 
     FROM tempData 
     WHERE device=1 AND dateTime 
     BETWEEN '${from}' AND '${to}'`;

     console.log("tempsProv :: ID: 3 get temps from : ",from," To: ",to);

     let con = await sql.connect();
     await con.query( mainQuery).then( ([rows,fields]) => {// await this promise
          let cleanData = null;
          if (rows.length) {
              cleanData = sortTimeStamps(cleanNULLS(rows));
          }
          result = {err:null,data:cleanData};
          con.end()
        })
        .catch((error)=>{//handle error
          logger.setLog("query").fatal(error);
          result = {err:error,data:null};
        });   
      return result;
};

//export class
module.exports = TempsProvider;