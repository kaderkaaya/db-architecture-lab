import RoleRepositories from "../repositories/user.js";
import ErrorHelper from './error-handler.js';
export default function permissionMiddleware({ endpointName }) {
    return async (req, res, next) => {
        try {
            const role = req.user.role;
            const userRoleDetails = await RoleRepositories.getRoleById({ roleId: role });
            if (!userRoleDetails) {
                throw new ErrorHelper('forbidden', 500);
            }
            const permissionMiddlewares = userRoleDetails.authEndpoints;

            if (!permissionMiddlewares.includes(endpointName)) {
                throw new ErrorHelper('forbidden', 500);
            }
            next();
        } catch (error) {
            next(error);
        }
    };
}
