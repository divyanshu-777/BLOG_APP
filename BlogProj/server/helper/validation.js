const logger = require('./logger')

module.exports = validation = (schema)=>{
 
    const options={
        abortEarly: false,
        allowUnknown: true,
        stripUnknown: true
    };

    return function (req,res,next) {
        
        const {error,value}= schema.validate(req.body,options);

        if(error){
            logger(req,res,error);
            return res.status(422).send({
                error : error.details,
                status :"422"
            });
        }
        else{
            req.body = value;
            next();
        }
    }
}