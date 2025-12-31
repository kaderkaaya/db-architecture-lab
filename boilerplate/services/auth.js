import UserRepository from '../repositories/user.js'
class UserService {
    static async createUser({ name, surname, email, password, phoneNumber }) {
        //   const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
        //   const isValidPassword = passwordRegex.test(password);
        //   if (!isValidPassword) {
        //      throw new ErrorHelper(Errors.PASSWORD_ERROR.message, Errors.PASSWORD_ERROR.statusCode);
        //   }
        const mailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValidEmail = mailRegex.test(email);
        if (!isValidEmail) {
            throw new ErrorHelper('email error', 500);
        }
        const user = await UserRepository.findByPhoneNumber({ phoneNumber });

        if (user) {
            throw new ErrorHelper('email error', 500);
        }
        //hash the password
        const hashedPassword = await HashHelper.hashPassword({ password });
        //burda logic eklenebilir sms vs
        return UserRepository.createUser({ name, surname, email, password: hashedPassword, phoneNumber });
    }

}
export default UserService;