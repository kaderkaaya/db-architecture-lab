class ResponseHandler {

    static async success({ res, data, message, statusCode }) {
        return res.status(statusCode).json({
            success: true,
            statusCode,
            data,
            message

        })
    }

    static async sendError({ res, message, statusCode }) {
        return res.status(statusCode).json({
            success: false,
            statusCode,
            message

        })
    }

}
export default ResponseHandler;