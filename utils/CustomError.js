class CustomError{
    constructor(status, message){
        this.status = status, 
        this.message = message
    }

    static badRequest(msg){
        return new CustomError(400, msg)
    }

    static unauthorized(msg){
        return new CustomError(401, msg);
    }

    static forbidden(msg){
        return new CustomError(403, msg);
    }

    static notFound(msg){
        return new CustomError(404, msg);
    }

    static internalServerError(msg){
        return new CustomError(500, msg);
    }

}

module.exports = CustomError



