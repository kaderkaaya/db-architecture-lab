import jwt, { decode } from "jsonwebtoken";
import ResponseHandler from "../utils/response-handler.js";
import UserRepository from "../repositories/user.js";
const JWT_SECRET = process.env.JWT_SECRET;

const authenticate = async (req, res, next) => {
    try {
        const token = req.headers?.authorization?.split(" ")[1];
        if (!token) {
            return ResponseHandler.sendError({
                res,
                message: 'Token Error',
                statusCode: 500
            });
        }
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await UserRepository.findById({ id: decoded.id });
        if (!user) {
            return ResponseHandler.sendError({
                res,
                message: 'Token Error',
                statusCode: 500
            });
        }
        req.user = user;
        next();
    } catch (e) {
        return ResponseHandler.sendError({
            res,
            message: 'Token Error',
            statusCode: 500
        });

    }
};


export default authenticate;