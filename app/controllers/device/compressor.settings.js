const logger = require('../../debugg/logger');
const compSettings = require('../../models/devices/control.comp');

exports.getAll = async(deviceId) => {
     let result = await sortData(deviceId,false);
    
     if(result){
          return result;
     }
     
     return false;
}

exports.forUpdate = async (deviceId) => {
     let result = await sortData(deviceId,false);
    // console.log("FOR UPDATE Final response : ",result);
     if(result){
          return result;
     }
     return false;
}

exports.deleteAck = async (deviceId) => {//apply this after sending the first package and ID=1
     await compSettings.setDeleteReq(deviceId);
}

exports.updatedAck = async (deviceId,slots) => {//apply this after sending every slot package
     for(let i=0;i<slots.length;i++){
          await compSettings.setUpdated(deviceId,slots[i]);
     }
}

exports.deleteReq = async (deviceId) => {
     let settings = await compSettings.findDeleteSlot(deviceId,false);
     
     if(settings.err==null){
          if(settings.data){
               console.log("DELETE REQ SLOT",settings.data);
               console.log("Setting all for update")
               await compSettings.setAll4Update(deviceId);

               return true;
          }
     }

     return false
}

exports.pendingUpdateALL= async(deviceId) => {
    await compSettings.setAll4Update(deviceId);// set pending update flag to true in all slots 
}

async function sortData(deviceId,getAll){
     let main=null;
     if(getAll){
          main = await compSettings.getMain(deviceId,false);
          
     }else{//get only to udpate values
          main = await compSettings.getMain(deviceId,true);
         
     }
     console.log("main compressor found for device ",deviceId," :: ",main)
     if(gotSomething(main)){
          let Pcheck = await compSettings.getPcheck(deviceId); 
          let parsed = parse(main.data,Pcheck.data);

          if(parsed){
               return {slots:parsed};
          } 
     }
     return false;
}

exports.setNewSlot = async(deviceId,params) => {
     await compSettings.setSlot(deviceId,params);
}

exports.setNewPcheck = async(deviceId,params) => {
     await compSettings.setPcheck(deviceId,params);
}

exports.setNewMain = async(deviceId,params) => {
     await compSettings.setMain(deviceId,params);
}

function parse(main,Pcheck){
     console.table(main);
     for(let index=0;index<main.length;index++){
         
          if(Pcheck.length){
               if(main[index].controlID==3 && main[index].powerCheck){
                    try{
                         let correctRow = Pcheck.filter((currentRow) => {
                              if(currentRow.slot==main[index].slot){
                                   return true;
                              }
                         },0);
                         main[index].powerCheck = (correctRow.length) ? correctRow[0] : null;
                         //console.log("power check index ",index," slot ",main[index].slot," : ",main[index].powerCheck);
                    }catch(e){
                         logger.setLog("server").error(e);
                    }
               }
          }

     }
     return main;
}


function gotSomething(result){
     if(result.err==null){
          if(result.data){
               return true;
          }
     }
     return false;
}