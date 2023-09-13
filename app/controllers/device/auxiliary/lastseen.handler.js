const logger = require('../../../debugg/logger');
const device = require('../../../models/devices/devices');
const time = require('../../date.time');

exports.set = async (deviceId) => {
     if(deviceId!=null && deviceId!=undefined && deviceId!=0){
          console.log("UPDATING last seen for device",deviceId)
          await device.setLastSeen(deviceId);
     }
}