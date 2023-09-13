tempsProvider = require('../../models/get.temps');
devicesProvider = require('../../models/devices/devices');
const logger = require('../../debugg/logger');
const time = require('../date.time');


exports.start = async () => {
     console.log("starting defrosting check");
     findDefrosting();
};

async function getDevices(){
     let devList = await devicesProvider.getIDs();

     if(devList.err==null){
          console.log("p1");
          return devList.data
     }
     logger.setLog('query').fatal(error);

     return false;
}

async function getSamples(id){
    let from = time.sortDateFormat(false,false)+" 00:00:00";//TESTING PURPOSE 
    let to = time.sortDateFormat(false,true);  

    let tempSamples = await tempsProvider.getSortedbyTS(id,from,to);

   // console.log("id ",id," ",tempSamples.data)
    if(tempSamples.err==null){
         if(tempSamples.data!=null){
         // console.log(tempSamples.data.temp4);
          return {plate: tempSamples.data.temp4, box: tempSamples.data.temp3};
         }
       
      return false;
     }
     logger.setLog('query').fatal(error);

     return false;
}

function insertRecord(){

}

async function findDefrosting(){
     
     const devicesList = await getDevices();

     console.log("p2");
     console.table(devicesList);

     var allSamp={};

     if(devicesList){

          for(let i=0;i<devicesList.length;i++){
               let samples = await getSamples(devicesList[i].DeviceID);//make a validation function like in past classes
               //console.log(samples);
               if(samples){
                    allSamp[i]={
                         id: devicesList[i].DeviceID,
                         alias: devicesList[i].alias,
                         plate: samples.plate,
                         box: samples.box
                    };
                        // console.log(`id : ${devicesList[i].DeviceID}`);
                         console.log(allSamp[devicesList[i].DeviceID].plate);
               }
               
          }
          console.log("p3");
          //VALIDATE TEMPS WITH TIME AND PERIOD

     }
     


}

function validate(allSamp){
     var felonCaught = {plate:false,box:false};
     const limitTempBox = -5;

     for(let i=0;i<allSamp.length;i++){
///////////////////////////////////////////////////////////////////
 ///validate if plate check is needed, may be not worth it!-------------------------
          for(let indexP=0;indexP<allSamp[i].plate.length;indexP++){
               
          }
//////////////////////////////////////////////////////////////////
          for(let indexB=0;indexB<allSamp[i].box.length;indexB++){
               felonCaught.box = (allSamp[i].box[indexB].temp>limitTempBox) ? true : false;// check if .temp is the right key
               // check logic, what if i find temps that fullfill the requisites but some of them will have 
               //longer time periods, so what would be the condition to save only the longest period?
               //also is it importanto to check last day and actual day values continuity ?
               if(felonCaught.box){
                    rowTitle = (setNewTitle) ? tempRows[i].temp : rowTitle;
                    setNewTitle=false;
                    relatedTempRows.push({
                         belongsTo:rowTitle,
                         temp:tempRows[i]
                    });

                    totalMinPeriod = totalMinPeriod+tempRows[i].period;
               }
          }
     }

}

