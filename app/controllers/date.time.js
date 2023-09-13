let moment = require('moment-timezone');


exports.scheduleValidationMX = (reference) => {
     let mainDate = new Date();
     let offsetDate = moment.tz(mainDate, "America/Mexico_City").format("YYYY-MM-DD HH:mm:ss");
     let d =  new Date(offsetDate);
     let fixedSec =(d.getSeconds()<10) ? ("0"+d.getSeconds()) : d.getSeconds();
     let fixedMin=(d.getMinutes()<10) ? ("0"+d.getMinutes()) : d.getMinutes();
     let fixedHour=(d.getHours()<10) ? ("0"+d.getHours()) : d.getHours();
     let actualTime = fixedHour+':'+fixedMin+':'+fixedSec;

     console.log("Server Date: ",this.sortDateFormat(mainDate,true)," Mexico :",this.sortDateFormat(d,true));

     for(let i=0;i<reference.length;i++){
          //console.log("time class :: comparing : ",reference[i]," vs actual: ",actualTime);
          
          let validation = actualTime.localeCompare(reference[i]);
          
          if(!validation){
          
               return true;
          }
     }
    
     return false;
}

exports.sortDateFormat = (date,time) => {//DATE : PASS A DATE, OR FALSE TO SET A NEW ONE ,TIME: FLAG TO GET BACK TIME FORMAT ALSO
     let d = undefined;
     if(!date){
          let mainDate = new Date();
          let offsetDate = moment.tz(mainDate, "America/Mexico_City").format("YYYY-MM-DD HH:mm:ss");
          d =  new Date(offsetDate);
     }else{
          d = new Date(date);
     }
     
     //console.log("AFTER ",d.getDate()+"/"+(d.getMonth()+1)+"/"+d.getFullYear()+"  "+d.getHours()+":"+d.getMinutes()+":"+d.getSeconds());
     let fixedSec =(d.getSeconds()<10) ? ("0"+d.getSeconds()) : d.getSeconds();
     let fixedMon =(d.getMonth()<9) ? ("0"+(d.getMonth()+1)) : (d.getMonth()+1);
     let fixedDay =(d.getDate()<10) ? ("0"+d.getDate()) : d.getDate();
     let fixedMin=(d.getMinutes()<10) ? ("0"+d.getMinutes()) : d.getMinutes();
     let fixedHour=(d.getHours()<10) ? ("0"+d.getHours()) : d.getHours();
     if(time){
          return d.getFullYear()+"-"+fixedMon+"-"+fixedDay+' '+fixedHour+':'+fixedMin+':'+fixedSec;
     }
     return d.getFullYear()+"-"+fixedMon+"-"+fixedDay;
}

exports.actualMX = (epoch) => {
     let mainDate = new Date();
     console.log("MAIN DATE :",mainDate)
     let offsetDate = moment.tz(mainDate, "America/Mexico_City").format("YYYY-MM-DD HH:mm:ss");
     console.log("OFFSET DATE :",offsetDate)
     // let d = new Date(offsetDate);
     // console.log("FINAL DATE",d)
     if(epoch){
          return Math.floor(mainDate.getTime()/1000);
     }

     let fixedSec =(d.getSeconds()<10) ? ("0"+d.getSeconds()) : d.getSeconds();
     let fixedMin=(d.getMinutes()<10) ? ("0"+d.getMinutes()) : d.getMinutes();
     let fixedHour=(d.getHours()<10) ? ("0"+d.getHours()) : d.getHours();

     return fixedHour+':'+fixedMin+':'+fixedSec;
}

exports.dateMX = () => {
     const mainDate = new Date();
     const offsetDate = moment.tz(mainDate, "America/Mexico_City").format("YYYY-MM-DD HH:mm:ss");
     let d = new Date(offsetDate);
     return d;
} 