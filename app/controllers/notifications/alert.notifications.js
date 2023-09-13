const logger = require('../../debugg/logger');
const alertsDetected = require('../../models/devices/alerts.detected');

exports.alertNotifications = async(deviceId,UserId) => {

     const alerts = await alertsDetected.getNotifications(deviceId,UserId);
   
     if(alerts.err==null){
          return alerts.data;
     }else{
          logger.setLog("alerts").error(alerts.err);
          return null;
     }
}
