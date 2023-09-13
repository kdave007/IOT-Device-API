const User = require("../models/authentication.model.js");

exports.validate = (req, res,succes) => {
     // Validate request
     console.log("validate :: email ",req.body.email);
     console.log("validate :: pass ",req.body.pass);
  if (!req.body) {
     res.status(400).end({
       message: "Content can not be empty!"
     });
   }
 
   // set user 
   const user = new User({
     email: req.body.email,
     pass: req.body.pass
   });
   
  // find user
   User.findUser(req.body.email,req.body.pass,(err,data) => {
     if (err) {
          if (err.kind === "not_found") {
            res.status(404).send({
              message: `Not found user : ${req.body.email}.`
            });
            succes(true,null);//passing the auth status in exports.validate arg
          } else {
            res.status(500).send({
              message: "Error retrieving user:" + req.body.email
            });
            succes(true,null);
          }
     }else{
          console.log("auth controller :: data ",data);
          console.log("auth controller :: type of ",typeof(data));
          succes(null,true);
     }
   });
  
};
