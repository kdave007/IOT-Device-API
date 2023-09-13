const time = require('../../Auxiliary_Classes/date.time');
const logger = require('../../Auxiliary_Classes/logger');
const devLastPost = require('../../Query_Classes/Device_Settings/last.post.model');
const liveEvents = require('../../Query_Classes/Events/live.events');
const eventsSubs = require('../../Query_Classes/Events/events.subscribers');

exports.recentLogs = async() => {
     let allLogs = false;
     let devicesList = await findDevices();
     
     if(devicesList.length){
          allLogs = await getLiveLogs();
          if(allLogs){
               return {error:false,allLogs,devicesList:(devicesList.length) ? devicesList : false} 
          }
     }
     return {error:true};
}

exports.findSubscriptions = async(devicesList) => {
     let subs = await getSubscribers(devicesList);
     return subs;
}

exports.afterSent = async(ackRows,devicesList) => {
     for(let index = 0; index<devicesList.length; index++){
          for(let i = 0; i<ackRows.length; i++){
               await liveEvents.setLogSeen(ackRows[i]);
          }
          await devLastPost.setAck(devicesList[index].deviceId); 
     }
}

async function findDevices(){
     let devicesList = await devLastPost.getRecentIDs();
     
     if(devicesList.err == null){
          return devicesList.data;
     }
     return false;
}

async function getLiveLogs(){
     let currentLogs = await liveEvents.allUnseenLogs();
     if(currentLogs.err==null){
          if(currentLogs.data.length){
               return currentLogs.data;
          }
     }
     return  false;
}

async function getSubscribers(devicesList){
     let subscriptions = [];
     for(let index=0; index<devicesList.length; index++){
          let deviceSubscription = await eventsSubs.findSubscribers(devicesList[index].deviceId);
     
          if(deviceSubscription.err==null && deviceSubscription.data.length){
               
               for(let i=0; i<deviceSubscription.data.length; i++){
                    let data = deviceSubscription.data[i];
                    let indexfound = subscriptions.findIndex(element => element.userId == data.userId);
                   
                    if(indexfound === -1){
                         
                         subscriptions.push({
                              userId : data.userId,
                              name : data.name,
                              email : data.email,
                              events :[{
                                   deviceId:devicesList[index].deviceId,
                                   codeId:data.liveEventId
                              }]
                         });
     
                    }else if(indexfound>=0){
                         subscriptions[indexfound].events.push({
                              deviceId:devicesList[index].deviceId,
                              codeId:data.liveEventId
                         });
                    }
               }

          }
     }
    return (subscriptions.length) ? subscriptions : false;
}