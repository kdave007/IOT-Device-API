

const CompressorWatchdog = {
}

CompressorWatchdog.watch = (data) => {
     statistics(data);
}

function statistics(data){
     let sum = [parseFloat(data.length),0,0,0,0,0,0];
     let t1 = [];
     let t2 = [];
     let floatVal=[];
     let justTest=[];
     let sumTotals={
       "X":0,
       "Y1":0,
       "Y2":0,
       "Xpow2":0,
       "Y1pow2":0,
       "Y2pow2":0,
       "XtimesY1":0,
       "XtimesY2":0
     };
     for(let index=0;index<data.length;index++){
       floatVal[0] = parseFloat(data[index].temp1);
       floatVal[1] = parseFloat(data[index].temp2);
     
       sum[1]=sum[1]+floatVal[0];
       sum[2]=sum[2]+floatVal[1];
       t1[index] = floatVal[0];
       t2[index] = floatVal[1];
    
       sumTotals.X = sumTotals.X + index;
       sumTotals.Y1 = sumTotals.Y1 + floatVal[0];
       sumTotals.Y2 = sumTotals.Y2 + floatVal[1];
       sumTotals.Xpow2 = sumTotals.Xpow2 + Math.pow((index),2);
       sumTotals.Y1pow2 = sumTotals.Y1pow2 + Math.pow((data[index].temp1),2);
       sumTotals.Y2pow2 = sumTotals.Y2pow2 + Math.pow((data[index].temp2),2);
     
       sumTotals.XtimesY1=sumTotals.XtimesY1 + floatVal[0]*index;
       sumTotals.XtimesY2=sumTotals.XtimesY2 + floatVal[1]*index;
 
       justTest[index] ={
         "y1":floatVal[0],
         "y2":floatVal[1],
         "y1^2":Math.pow((data[index].temp1),2),//
         "y2^2":Math.pow((data[index].temp2),2),//
         "X^2":Math.pow(index,2),
         "X * Y1":(floatVal[0]*(index)),
         "X * Y2":(floatVal[1]*(index))
       }
     }
 
     let totals=new Array({
        "x Sum" : sumTotals.X,
        "y1 Sum": sumTotals.Y1,
        "y2 Sum": sumTotals.Y2,
        "y1^2 Sum":sumTotals.Y1pow2,
        "y2^2 Sum":sumTotals.Y2pow2,
        "X^2": sumTotals.Xpow2,
        "X * Y1 Sum": sumTotals.XtimesY1,
        "X * Y2 Sum": sumTotals.XtimesY2
     });
     average={
       temp1:(sum[1]/data.length),
       temp2:(sum[2]/data.length)
     }
     // console.table(average);
     // console.table(justTest);
     // console.table(totals);
 
     let b1 = ((parseFloat(data.length))*sumTotals.XtimesY1)-(sumTotals.X*sumTotals.Y1);// DELETE THE -1 besides parseFloat !!!!!!!!!!
     b1 = b1/((((parseFloat(data.length))*sumTotals.Xpow2)-Math.pow(sumTotals.X,2)));
     let b2 = ((parseFloat(data.length))*sumTotals.XtimesY2)-(sumTotals.X*sumTotals.Y2);
     b2 = b2/((((parseFloat(data.length))*sumTotals.Xpow2)-Math.pow(sumTotals.X,2)));
   
     let a1 = ((sumTotals.Y1)-(b1*sumTotals.X))/
       (parseFloat(data.length));
     let a2 = ((sumTotals.Y2)-(b2*sumTotals.X))/
       (parseFloat(data.length));  
     let results={
       b1:b1,
       b2:b2,
       a1:a1,
       a2:a2
     }
     console.table(results);
     let Y1f = a1+(b1*((data.length+1)));
     let Y2f = a2+(b2*((data.length+1)));
     console.log((data.length+1)," : ",Y1f);
     console.log((data.length+1)," : ",Y2f);
     let predArray=[];
     for(let index=0;index<t1.length;index++){
       predArray[index]={
         t1:t1[index],
         t2:t2[index]
       }
     }
     for(let index=1;index<21;index++){
       predArray[(144+index)]={
         t1:a1+(b1*((data.length+index))),
         t2:a2+(b2*((data.length+index)))
       }
     }
 
     console.table(predArray);
   }

function cleanNulls(array,key1,key2){
     var indexFailure=[];
     for(var c = 0; c<array.length;c++){
       if(array[c][key1]=="null"){
         array[c][key1]=-200;
         indexFailure.push({index:c,sensor:key1});
       }
       if(array[c][key2]=="null"){
         array[c][key2]=-200;  
         indexFailure.push({index:c,sensor:key2});
       }
   
     }
     if(indexFailure.length!=0){
       //console.log("List of index null data: ",indexFailure)
     }
     return array;
}

module.exports = CompressorWatchdog;
 