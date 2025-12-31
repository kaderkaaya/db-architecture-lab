import ResponseHandler from "../utils/response-handler";
import UserService from '../services/auth.js';
class UserController {
    static async createUser(req, res) {
        try {
            const { name, surname, email, password, phoneNumber } = req.body;
            const user = await UserService.createUser({ name, surname, email, password, phoneNumber });
            return ResponseHandler.success({ res, statusCode: 201, message: 'user created successfully', data: { user } });
        } catch (error) {
            return ResponseHandler.sendError({ res, statusCode: error.statusCode || 500, message: error.message });
        }
    }

}

export default UserController;