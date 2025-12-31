import jwt from "jsonwebtoken";
const JWTKEY = process.env.JWT_SECRET;
import ErrorHelper from '../utils/response-handler.js'

class JwtHelper {

    static async generateToken({ payload, expiresIn }) {
        return jwt.sign(payload, JWTKEY, { expiresIn });
    }
    static async verifyToken({ token }) {
        try {
            const decoded = jwt.verify(token, JWTKEY);
            return decoded;
        } catch (error) {
            return ErrorHelper.sendError({ res: null, statusCode: 401, message: 'invalid Token' });
        }
    }
}
export default JwtHelper;