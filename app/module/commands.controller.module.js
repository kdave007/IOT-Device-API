const User = require("../models/authentication.model.js");
const TempsProv = require("../models/get.temps.js");
const alertsView = require("../controllers/notifications/alert.notifications");
const logger = require("../debugg/logger");
const cmd = require('../module/utils');

exports.taskAllocator = async (req,res) => {
     
     switch (req.CMDReq){
          case cmd.PREDICTIVE_COMPRESSOR :

               logger.setLog('server').info('Predictive Compressor Requested');
               predictiveCompressor(res);

          break;
          case cmd.ALERTS_NOTIFICATIONS :

               logger.setLog('server').info('Alerts Notifications Requested');
               let rows =  await alertsView.alertNotifications(req.device,req.user);
               res.send(rows);

          break;
          case cmd.VOLTAGES:

               logger.setLog('server').info('Get Voltages Requested');
               voltsProv.getVoltages(req.id,req.from,req.to);

          break
          default:

               console.log("cmd controller :: not valid cmd found");
               res.status(404).send({
                    message : `command not found `
               });

          break;
     } 
};

function predictiveCompressor(res){
     const devId = 2;//testing purpose only
     const tempsProv = new TempsProv({
          id: devId
     });

     console.log("process temps for predictive analysis");
     const from = '2020-01-01 22:27:59';//testing purpose only
     const to = '2020-01-01 23:59:59';//testing purpose only
     TempsProv.getTempsbyDatesRange(devId,from,to,(err,data) => {
          if(err){
               res.status(404).json({
                    message : `data not found : ${err}`
                    });
          }else{
                    res.json(data);
                    //console.log(data);
          }
     });
}