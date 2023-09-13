const http = require('http');
const nodeMailer = require('nodemailer');
//const host = "coolchain.com.mx";
const host = "localhost";
const STATION = {
     DEVICES : 0,
     INTERFACE : 1
}

exports.watchDevicesStation = async () => {
     let buf = Buffer.from(JSON.stringify({
          dummy:"official test"
     }));
     await post(host,"/CONFIGS",8080,buf,async(result) => {
          console.log("device result is",result)
          await postPin(result,STATION.DEVICES);
     });
}

exports.watchInterfaceStation = async () => {
     let buf = Buffer.from(JSON.stringify({
               "debug":false,
               dummy:"official test",
     }));
     await post(host,"/mother_base",94,buf, async(result) => {
          console.log("interface result is",result)
          await postPin(result,STATION.INTERFACE);
     }); 
}

async function post(host,path,port,buf,afterMath){
     let options = {
          host,
          port, 
          path,
          method:"POST",
          headers: {
               'Content-Type': 'application/json',
               'Content-Length': buf.length,
               'Access-Control-Allow-Headers':'Content-Type',
               'Access-Control-Allow-Methods':'PUT, GET, POST, DELETE, OPTIONS',
               'Accept': 'application/json'
           }
     };

     console.log("sleepwalker is about to post...")

     let innerReq = await http.request(options,async (response) =>{
          let bodyChunks = [];
          await response.on('data', function(chunk) {
            // You can process streamed parts here...
            bodyChunks.push(chunk);
          }).on('end', function() {
            let body = Buffer.concat(bodyChunks);
            console.log('BODY: ' + body, response.statusCode);
               return afterMath({error:false, isAlive:true, status:response.statusCode, body});
          });

     }).on('error', (error) => {
          // if we get an error it means that the server must be down
          console.log("there was an exception",error);
          return afterMath({error, isAlive:false, status:500});
     });

     innerReq.write(buf);
     innerReq.end();
}

async function postPin(result,stationId){
     if(!result.isAlive){
          //server did not respond back, send an email!
          await sendEmails(stationId);
     }
}

async function sendEmails(stationId){
     let identifiers = ["los dispositivos","la interfaz de usuario"];
     let message = `El servidor encargado de ${identifiers[stationId]} ha dejado de responder, por favor revise que el servidor este corriendo.`;
     let users = [
          "kevin@atechnik.com.mx",
          "juan.esponda@atechnik.com.mx",
          "antonio@atechnik.com.mx",
          "eric.perusquia@amigrobotics.com",
          "design@atechnik.com.mx"
     ];

     let transporter = nodeMailer.createTransport({
          service:"gmail",
          auth: {
            user: 'htelemetry.sender1@gmail.com',
            pass: "atechnik"
          //   user: 'cool.chain.at@gmail.com',
          //   pass: '1q2w3e1Q2W3E'
          }
     });

     let mailOptions = {
          from:"htelemetry.sender1@gmail.com",
          to: undefined,
          subject:"CoolChain: Atención URGENTE requerida a servidores",
          text:message
     };

     for(let i = 0; i < users.length; i++){
          mailOptions.to = users[i];
          transporter.sendMail(mailOptions ,(error,info) => {
               if(error){
                    console.log("error sending mail ", error);
               }else{
                    console.log(" mail sent ");
               }
          }); 
     }
}