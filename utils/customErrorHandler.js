const CustomError = require("./CustomError");


const customErrorHandler = (err,req,res,next) =>{
    console.log('Inside error handler:',err);

    // handle response for custom errors
    if(err instanceof CustomError){
        return res.status(err.status).json({
            success: false,
            message: err.message
        })
    }

    // handle default errors
    return res.status(500).json({
        success: false,
        message: err.message
    })
}

module.exports =  customErrorHandler;