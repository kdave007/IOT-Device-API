const VoltageProvider = require('../../models/samples/voltages');

const voltageSamples=function(){};

voltageSamples.getVoltages = async (id,start,end) => {
    let batSamp = await VoltageProvider.getBatterySamp(id,start,end);
    let compSamp = await VoltageProvider.getCompressorSamp(id,start,end);
    console.log("------- battery voltage");
    console.table(batSamp.data);
    console.log("------- compressor voltage");
    console.table(compSamp.data);
}

module.exports = voltageSamples;