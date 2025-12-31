import UserModel from '../models/user.js';

class UserRepository {
    static async createUser({ name, surname, email, password, phoneNumber }) {
        const user = await UserModel.create({
            name,
            surname,
            email,
            password,
            phoneNumber,
        });
        return user;
    }

    static async findByPhoneNumber({ phoneNumber }) {
        const user = await UserModel.findOne({ where: { phoneNumber } });
        return user;
    }

    static async findById({ id }) {
        return await UserModel.findOne({ where: { id } });
    }

}
export default UserRepository;