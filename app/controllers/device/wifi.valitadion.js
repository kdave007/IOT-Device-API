const sql = require("../../models/db.connection");
const logger = require('../../debugg/logger');
const states = require('../../module/states.machine.client');
const oldConfig = require('../../models/devices/devices.configA');

const wifiSettings = {};

wifiSettings.getWifi = async (id,scenario) => {
    let result = await queryWIFI(id,scenario);
    if(result.error == null){
          
          return {error:null, data:result.data};
    }
    return {error: result.error, data:null};//CANNOT CONTINUE WITHOUT WIFI PROFILES
}

wifiSettings.deletenAck = async(id) => {
      await setAck(id);
      await erase(id);
}

async function queryWIFI(id,scenario) {
     let deleteReq = false;
     var wifi = false; let caseDeleteAllowed = false;
     //id = 4;//delete later

     switch (scenario){
          case states.TASK.NEW_DEF:
               console.log("new device -------"); 
               wifi = await oldConfig.getWIFI(id,states.TASK.NEW_DEF);// 0 to get all wifi profile rows 
               //IF WE GET NO ROWS, WE MUST STOP ALL THE PROCCESS AND SEND AN ERROR : 204...   
          break;
          case states.TASK.GET_ALL:
               console.log("get all -------"); 
               wifi = await oldConfig.getWIFI(id,states.TASK.NEW_DEF);// 0 to get all wifi profile rows 
               //IF WE GET NO ROWS, WE MUST STOP ALL THE PROCCESS AND SEND AN ERROR : 204...   
          break;
          case states.TASK.GET_UPDT:
               console.log("update --------");
               wifi = await oldConfig.getWIFI(id,states.TASK.GET_UPDT);//1 to get only (pending==1) profile rows
               deleteReq = await oldConfig.getWIFI4Delete(id);
               caseDeleteAllowed = true;
              
               // if(!queryGotSomething(wifi)){
               //      //IF WE DONT GET ROWS, WE DONT HAVE ANY PROFILE TO UDPATE
               //      console.log("no wifi updates required");
                    
               //      //return {error:null, data:{"WIFI":false, "WIFI-ERASE":false}}; 
               //      return {error:null, data:false}
               // }
                  
          break;
          default:
               
               logger.setLog('server').fatal(`wifi validation :: cannot find task scenario.`);
          break;
     }

     if(queryGotSomething(wifi)){//wifi ap table

         if(validateWIFIProf(wifi.data)){
               //return {error:null, data:{"WIFI":getForUpdate(wifi.data), "WIFI-ERASE":getDeleteReq(wifi.data)}};  
               let data = {};
               let update = getForUpdate(wifi.data);
               if(deleteReq && deleteReq.err==null){
                    console.log("deleteReq ",deleteReq)
                    deleteReq = getDeleteReq(deleteReq.data);
               }
               
               console.log("wifi ----- ",wifi.data);
               console.log("wifi erase ------ ",deleteReq);

               if(update){
                    data["WIFI"]=update;  
               }
               if(deleteReq){
                    data["WIFI-ERASE"]=deleteReq;
               }
               
               return {error:null, data: (data["WIFI"]==undefined && data["WIFI-ERASE"]==undefined) ? false : data };  
         }
          
     }

     if(caseDeleteAllowed){
          console.log("deleteReq",deleteReq)
          if(deleteReq.err==null){
               let data = {};
               deleteReq = getDeleteReq(deleteReq.data);

               if(deleteReq){
                    data["WIFI-ERASE"]=deleteReq;
               }
               
               return {error:null, data: (data["WIFI-ERASE"]==undefined) ? false : data };  
          }
     }
     //ON NEW_DEF CASE .. If there is not WIFI PROFILES FOUND, CANNOT CONTINUE, END ALL TASKS
     logger.setLog('server').fatal(`wifi validation :: cannot find valid WIFI profiles, cannot continue, device Id :${id}`);
     
     return {error: null, data:false};
}

function getDeleteReq(rows){
     var deleteA = [];
     var once = false;
     
     for(let i=0;i<rows.length;i++){
          console.log("wifi Ap's to delete: ");
          console.table(rows[i]);
          deleteA.push(rows[i].apId);
          once = true;
          
     }

     if(once){
          return deleteA;
     }

     return false;
}

async function setAck(deviceId){
     console.log("WIFI ACKNOWLEDGMENT UPDATE:");
   
     var result = await oldConfig.setAckWIFI(deviceId);

     if(!result.data){
          logger.setLog('pendings').error(`wifi validation :: No rows affected on WIFI profiles pending values to deviceId=${deviceId}.`);
     } 
     return result;   
}

async function erase(id){
     let result = await oldConfig.setDeleteReq(id);
     return result; 
}

function getForUpdate(rows){
     var update = [];
     
     for(let i=0;i<rows.length;i++){

          if( !(rows[i].ssid=='') && !( rows[i].ssid==undefined) ){
               
          
               update.push({
                    "ID": rows[i].apId,
                    "PRY": (rows[i].priority+1),
                    "SSID": (rows[i].ssid=='' || rows[i].ssid==undefined) ? null : rows[i].ssid,
                    "KEY": (rows[i].key=='' || rows[i].key==undefined) ? null : rows[i].key,
                    "BSSID": (rows[i].bssid=='' || rows[i].bssid==undefined) ? null : rows[i].bssid
               });
          }
          
     }

     if(update.length){

          return update;
     }

     return false;
}

function queryGotSomething(row){
     if(row.err==null){
          if(row.data){
               return true;
          }
     }
     return false;
}

function validateWIFIProf(rows){
     var validP = 0;
     
     for(let i=0;i<rows.length;i++){
        
         if( !(rows[i].ssid==undefined) && !(rows[i].ssid=='')  ){
               validP++;
         }
     }
     console.log(`valid WIFI profiles found: ${validP}`);
     if(validP>0){

          return true;
     }

     return false;
}


module.exports = wifiSettings;
