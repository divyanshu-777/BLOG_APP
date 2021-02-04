const fs= require("fs");

module.exports = (req, res, err) => {
    let now = new Date();
    let log =`${now}: ${req.method} ${req.url} ${err}`
    fs.appendFile("serverLog.txt",log + '\n',(err)=>{
        if(err){
            console.log(err);
        }
    })
     return true;
 };
