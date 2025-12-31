import sequelize from "./config/database.js";
import express from "express";
import UserRouter from './routes/auth.js';
import helmet from "helmet";

const USER_PORT = process.env.USER_PORT;
const app = express();
app.use(express.json());
app.use(helmet());
app.use('/user', UserRouter);

const startServer = async () => {
    try {
        console.log("Starting server...");
        await sequelize.authenticate();
        await sequelize.sync({ force: false });
    } catch (error) {
        console.error("Failed to start server:", error);
    }
};

startServer();
app.listen(USER_PORT, () => {
    console.log(`Server is running on port ${USER_PORT}`);
});