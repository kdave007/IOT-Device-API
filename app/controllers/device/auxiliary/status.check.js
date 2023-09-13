const logger = require('../../../debugg/logger');
const states = require('../../../module/states.machine.client');
var sizeof = require('object-sizeof');
const resetDevice = require('../../../models/devices/reset.pending');

const finalCheck={};

finalCheck.validateStatus =async (id,settingsJson) => {
     try{
          let sendPackage = false;
          let status = 500;
          
          if(settingsJson.length){
               sendPackage = dividerCheck(settingsJson);//here we need to return keys updated for this package (part1)
               status = sendPackage.status;   

               if(sendPackage.updatedKeys){
          
                    if(sendPackage.data[states.SETTINGS.LIGHT_MOD]!=undefined){//if we have light config update, must reset the device
                         console.log("Found L-MOD, must reset device ");
                         //this code always sends the WIFI and L-MOD in the last package (if there is more than one), so we
                         //can tell the device to reset!.
                         status = 200//206; //this package contains L-MOD config, so we must be in the last package,hence, ask for a rePost to restart the device!.
                         console.log("SETTING RESET ON <---------------------------------------------------------")
                         await resetDevice.setPending(id,1);// set true, to reset
                    }
               }
               
               return {status: status, package: sendPackage.data, pKeys: sendPackage.updatedKeys};
          }

          return false;
     }catch(e){
          logger.setLog('server').error(e);
     }
}

function getKeysAndArray(data){
     let keysObject = {};
     let keysArray =[];

     for(let i=0;i<data.length;i++){
          //keys[Object.keys(data[i])]=true;
          keysObject[Object.keys(data[i])]=Object.keys(data[i])+"";
          keysArray[i]=Object.keys(data[i])+"";
     }
     
     if(keysArray.length){
          return {object:keysObject,array:keysArray};
     }
     console.log("zero keys, therefore no data");
     return false;
}

function dividerCheck(data){
     let status = 204;
     var waitingLine = {simple:false,light:false,wifi:false,compressor:false};
     let simpleCount = 0; let keysObject = null; let keysArray = null;
     let keysRetrieved = getKeysAndArray(data);
     if(keysRetrieved){
         keysObject = keysRetrieved.object;
         keysArray = keysRetrieved.array;
     }
     
     console.log(" object ",keysObject);
     console.log(" keysArray ",keysArray);
    
     simpleCount = findSimple(data);
 
     waitingLine.simple = ( simpleCount ) ? true : false;
     waitingLine.compressor = ( keysObject[states.SETTINGS.COMP_CONTROL]!=undefined ) ? true : false;
     waitingLine.light = ( keysObject[states.SETTINGS.LIGHT_MOD]!=undefined ) ? true : false;
     waitingLine.wifi = ( keysObject[states.SETTINGS.WIFI_CONFIG]!=undefined ) ? true : false;

     if(waitingLine.simple){
          let simpleSettings = removeAllButSimple(data);
          //NOW SORT TO SEND IS THE NEXT STEP
          data = sortToSend(keysArray,simpleSettings);
          console.log("first send simple");

     }else if(waitingLine.compressor){
          let elements = findCompressor(data);
          status = (waitingLine.light || waitingLine.wifi ) ? 206 : 200;//if still another package type waiting to be sent...
          if(elements.count>10){//we have to send another package
               status = 206;
          }
          sortedComp = sortCompressorPackage(data,elements.index);
          data = sortedComp.data;//ADD SLOTS BACK TO NEXT FUNCTIONS TO SET ACK LATER
          console.log("send compressor elements info ",elements);
          
     }else if(waitingLine.wifi){
          console.log("send wifi");
     }else if(waitingLine.light){
          console.log("send light");
     }

     return {status: status, data:data , updatedKeys:keys}//TESTING ONLY, ERROR IN THIS RESPONSE
}

function dividerChec(keys,data){
     var divide = {caseA:false,caseB:false,caseC:false};
     var size = parseInt(data.length);

     divide.caseA = ( keys[states.SETTINGS.LIGHT_MOD]!=undefined ) ? true : false;
     divide.caseB = ( keys[states.SETTINGS.WIFI_CONFIG]!=undefined ) ? true : false;
     divide.caseC = ( keys[states.SETTINGS.COMP_CONTROL]!=undefined ) ? true : false;

     if(divide.caseC){

     }

     if(divide.caseA && divide.caseB){

          if( size < 3){
               sorted = dividePackage(data,states.PACKAGE_RESOLVE._1P ,false);
              
          }else{
               sorted = dividePackage(data,states.PACKAGE_RESOLVE._2P,false);
             
          }

     }else if(divide.caseA){
          
          sorted = dividePackage(data,states.PACKAGE_RESOLVE._1P ,states.SETTINGS.LIGHT_MOD);

     }else if(divide.caseB){
        
          if( size == 1 ){
               sorted = dividePackage(data,states.PACKAGE_RESOLVE._1P ,states.SETTINGS.WIFI_CONFIG);
          }else{
               sorted = dividePackage(data,states.PACKAGE_RESOLVE._2P ,states.SETTINGS.WIFI_CONFIG);
          }

     }
     if(!divide.caseA && !divide.caseB){
       
          sorted = dividePackage(data,states.PACKAGE_RESOLVE._1P ,false);
     }

     return sorted;
}

function dividePackage(data,sortType,target){
     var size = {one:1,two:2};
     let dataPackage = false;

     switch (sortType){
          case states.PACKAGE_RESOLVE._1P:
               dataPackage = sortPackage(data,size.one,target);
          break;
          case states.PACKAGE_RESOLVE._2P:
               dataPackage = sortPackage(data,size.two,target);
          break;
          default:
               logger.setLog('server').fatal("status check :: Couldn't sort package");
          break;
     }

     return dataPackage;
}

function sortPackage(data,parts,target){
     var updatedKeys = [];
     var packageA = {};
     var packageB = {};
    
     var status = 500;//ERROR BY DEFAULT

     for(let i=0;i<data.length;i++){
          updatedKeys.push(Object.keys(data[i]));
          packageA[updatedKeys[i]] = data[i][updatedKeys[i]];
     }
     status = 200;//1 PART, OK STATUS
     
     if(parts==2){
          status = 206;// NEEDS A REPOST, TO GET SECOND PART

          switch (target){
               case false:

                    console.log(`case : BOTH`);
                    updatedKeys = updatedKeys.filter((element) => {
                         if(element!=states.SETTINGS.WIFI_CONFIG && element!=states.SETTINGS.LIGHT_MOD){
                              return element;
                         }
                    });
                 

                    packageB = {
                         [states.SETTINGS.WIFI_CONFIG]: packageA[states.SETTINGS.WIFI_CONFIG],
                         [states.SETTINGS.LIGHT_MOD]: packageA[states.SETTINGS.LIGHT_MOD]
                    }
                    delete packageA[ states.SETTINGS.WIFI_CONFIG ];
                    delete packageA[ states.SETTINGS.LIGHT_MOD ];
               break;

               case states.SETTINGS.WIFI_CONFIG:

                    console.log(`case : WIFI`);
                    updatedKeys = updatedKeys.filter((element) => {
                              if(element!=states.SETTINGS.WIFI_CONFIG){
                                   return element;
                              }
                         });

                    packageB = {
                         [states.SETTINGS.WIFI_CONFIG]: packageA[states.SETTINGS.WIFI_CONFIG]
                    }
                    delete packageA[ states.SETTINGS.WIFI_CONFIG ];
               break;

               case states.SETTINGS.LIGHT_MOD:

                    console.log(`case : LIGHT `);
                    updatedKeys = updatedKeys.filter((element) => {
                                        if(element!=states.SETTINGS.LIGHT_MOD){
                                             return element;
                                        }
                                   });

                    packageB = {
                         [states.SETTINGS.LIGHT_MOD]: packageA[states.SETTINGS.LIGHT_MOD]
                    }
                    delete packageA[ states.SETTINGS.LIGHT_MOD ];
               break;
               default:
                    logger.setLog('server').fatal("status check :: Couldn't sort package");
               break;
          }
          console.log("package 1",packageA);
          console.log("package 2",packageB);
          console.log("p1 size: ",sizeof(packageA)," p2 size: ",sizeof(packageB));     

          return {updatedKeys: updatedKeys, data: packageA, status: status};  
     }

     return {updatedKeys: updatedKeys, data: packageA, status: status};
}


function findSimple(rows){
     let count = 0;
    
     for(let index=0;index<rows.length;index++) {
          if(rows[index][states.SETTINGS.COMP_CONTROL]==undefined && rows[index][states.SETTINGS.LIGHT_MOD]==undefined && rows[index][states.SETTINGS.WIFI_CONFIG]==undefined){
               count++;
          }
     }
     return count;
}

function findCompressor(data){
     let length =0;
     let index =0;
     for(let i=0;i<data.length;i++){
          if(data[i][states.SETTINGS.COMP_CONTROL]!=undefined){
               length = data[i][states.SETTINGS.COMP_CONTROL]["CTRL"].length;
               index = i;
          }
     }
     return {count:length, index:index};
}

function sortToSend(keys,rows){
     let jsonToSend = {}
     keys.array.forEach(element => {
          console.log("33 ",element);
     });
          let key = Object.keys(rows[i]);
          console.log("got keys ",keys)
          jsonToSend[key]=rows[i];
  
     console.log(jsonToSend);
     return jsonToSend;
}

function sortCompressorPackage(data,position){
     console.log("sort package ",data[position]["C-CONTROL"]["CTRL"].length);
     let totalRows = data[position]["C-CONTROL"]["CTRL"].length;
     let slotsSent = [];
     let selected = [];
     for(let i=0;i<totalRows;i++){
          if(i<10){
               selected.push(data[position]["C-CONTROL"]["CTRL"][i]);//create array with only 10 max elements
               slotsSent.push(data[position]["C-CONTROL"]["CTRL"][i]["BUFF"]);//identify slots to send on this package
          }
     }
     console.log("slots in this package : ",slotsSent);
     return {slots:slotsSent,data:selected};
}

function removeAllButSimple(data){//only keep simple settings
     filtered = [];
     filtered = data.filter((element) => {
          if(element[states.SETTINGS.COMP_CONTROL]==undefined && element[states.SETTINGS.LIGHT_MOD]==undefined && element[states.SETTINGS.WIFI_CONFIG]==undefined){
               return true;
          }
     });

     if(filtered.length){
          return filtered;
     }
     return false;
}

module.exports = finalCheck;   
