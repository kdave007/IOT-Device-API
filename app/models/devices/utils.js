/**
 * @brief
 *  Data struct for JSON's to 
 *  send to device
 *  as DEFAULT VALUES JSON 
 *  intended to be sent 
 *  for the first time 
 *  a new device get registered,
 *  make sure that if you
 *  modify a value here,
 *  does not crashes the device logic's!!,
 *  and also, this values have to 
 *  match with default.DB JSON.
 */

  ///////////////////
 // THERM_CAL   ////
///////////////////

var thermCal = {
     "THERM_CAL": [//ALL INT
                   0,
                   0,
                   0,
                   0
                  ]
}

  ///////////////////
 /// REPORT      ///
///////////////////

var reportDevice = {//DEFAULT VALUES READY : JSON FOR DEVICE
     "REPORT":{
               "TYPE":0,
               "TIME": 2,
               "LTE": false,
               "GPS": false,
               "SAMP-T": 0,
               "SAMP-N": 0
             }
}


  ///////////////////
 ///SENS-FILTER  ///
///////////////////

var sensFilter = {//ALL INT
     "SENS-FILTER":[
                    1000,
                    1000,
                    1000,
                    1000,
                    1000,
                    1000,
                    1000,
                    1000,
                    1000,
                    1000,
                    1000,
                    1000,
                    1000,
                    1000,
                    1000,
                    1000
                   ]
}

  ///////////////////
 /// WIFI        ///
///////////////////

var wifiConfig = {//THIS IS JUST AN EXAMPLE, THERE IS NO DEFAULT FOR WIFI...
     "WIFI": 
       [
         {
           "ID": 1,
           "PRY": 1,
           "SSID":"SSID TEST 1",
           "KEY": "KEY TEST 1",
           "BSSID": "00:A0:C9:14:C8:29"
         },
         {
           "ID": 2,
           "PRY": 2,
           "SSID":"SSID TEST 2",
           "KEY": "KEY TEST 2",
           "BSSID": null
         }
       ]
   }

var deleteWifi = {//THIS IS JUST AN EXAMPLE, THERE IS NO DEFAULT TO DELETE WIFI...
                    "WIFI-ERASE":[1,2]
                 }   
   

  ///////////////////////
 /// ADVANCED CONFIG ///
///////////////////////

var advancedConfig = {
     "AV-CONF":{
                    "KA":0,
                    "KA-GPS": 12,
                    "GPS-LOG": 0,
                    "TIME": 1590533403,
                    //"KEY": "@f@El&1V30fg5Vkr*F5rDfgWRrelT6ca" //auto generated in script...
                    "DAY": "actualDay"//must be generated in script
                  }
}

  ////////////////////////////
 ///LIGHT SENSORS MODULES ///
////////////////////////////

var lightModules = {
     "L-MOD":[
        {
           "ID":1,// 1-4
           "EN":false,
           "ADD":11,//MUST ASSIGN THIS DEPENDING ON THE PCB DIP SWITCH
           
           "SENS": [
            {
              "TH": 10,//FLOAT
              "ED": true,
              "FI": 1000,
              "ST": true
            },
            {
              "TH": 10,//FLOAT
              "ED": true,
              "FI": 1000,
              "ST": false
            },
            {
              "TH": 10,//FLOAT
              "ED": true,
              "FI": 1000,
              "ST": false
            }
           ]
        },
        {
           "ID":2,
           "EN":false,
           "ADD":22,//MUST ASSIGN THIS DEPENDING ON THE PCB DIP SWITCH
           
           "SENS": [
            {
              "TH": 10,//FLOAT
              "ED": true,
              "FI": 1000,
              "ST": true
            },
            {
              "TH": 10,//FLOAT
              "ED": true,
              "FI": 1000,
              "ST": false
            },
            {
              "TH": 10,//FLOAT
              "ED": true,
              "FI": 1000,
              "ST": false
            }
           ]
        },
        {
           "ID":3,
           "EN":false,
           "ADD":33,//MUST ASSIGN THIS DEPENDING ON THE PCB DIP SWITCH
           
           "SENS": [
            {
              "TH": 10,
              "ED": true,
              "FI": 1000,
              "ST": true
            },
            {
              "TH": 10,
              "ED": true,
              "FI": 1000,
              "ST": false
            },
            {
              "TH": 10,
              "ED": true,
              "FI": 1000,
              "ST": false
            }
           ]
        },
        {
           "ID":4,
           "EN":false,
           "ADD":44,//MUST ASSIGN THIS DEPENDING ON THE PCB DIP SWITCH
           
           "SENS": [
            {
              "TH": 10,
              "ED": true,
              "FI": 1000,
              "ST": true
            },
            {
              "TH": 10,
              "ED": true,
              "FI": 1000,
              "ST": false
            },
            {
              "TH": 10,
              "ED": true,
              "FI": 1000,
              "ST": false
            }
           ]
        }
     ]
  }

  ////////////////////////////
 ///TRUCK MONITOR CONFIG  ///
////////////////////////////

var monitorConfig = {//ALL INT
          "MONITOR-CONF":{
               "DEF":{
                    "TH":-1,
                    "TIMEOUT":300000,
                    "STABLE":300000
               },
               "COMP-D":{
                    "HIGH":60,
                    "LOW":5,
                    "HIGH-T":600000,
                    "LOW-T":600000,
                    "OK-T":300000,
                    "STOP-H": false,
                    "STOP-L": false
               },
               "COMP-S":{
                    "HIGH":60,
                    "LOW":5,
                    "HIGH-T":600000,
                    "LOW-T":600000,
                    "OK-T":300000,
                    "STOP-H": false,
                    "STOP-L": false
               },
               "DOOR":{
                    "OPEN-T":60000,
                    "CLOSE-T":60000
               },
               "M-POWER":{
                    "ON":0,
                    "OFF":0
                },
               "CEDIS-P":{
                    "ON":0,
                    "OFF":0
                },
                "COMP-DIFF":{
                  "TH":5,
                  "TIME":300000,
                  "STOP":false
                },
                "POWERBANK-P":{
                  "FULL-V":4.00,
                  "FULL-U":5,
                  "FULL-D":5,
                  "EMPTY-V":3.4,
                  "EMPTY-U":5,
                  "EMPTY-D":5,
                  "DIFF": 0.5
                },
                "COMP-ON":{
                  "OFF":  259200
                }
          }
  }

  ////////////////////////////
 /// LIVE EVENT       ///////
////////////////////////////

var liveEvent = {
     "LIVE-EVENT":[
      false,
      false,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      true,
      false,
      true
        // false,
        // false,
        // false
     ]
}

var packageTypes = {
      WIFI:"WIFI",
      MISC:"MISC",
      COMP_CONTROL:"C-CONTROL",
      L_MOD:"L-MOD"
}

module.exports = {
    thermCal,
    reportDevice,
    sensFilter,
    wifiConfig,
    deleteWifi,
    advancedConfig,
    lightModules,
    monitorConfig,
    liveEvent,
    packageTypes
}