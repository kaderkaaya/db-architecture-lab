import { Sequelize } from "sequelize";
import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({
    path: path.resolve(__dirname, "../../.env"),
});

//burda env dosyası src dısında oldugu ıcın path ile yolunu belirttık
const DB_DIALECT = process.env.DB_DIALECT;
const DB_HOST = process.env.DB_HOST;
const DB_NAME = process.env.DB_NAME;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;

const sequelize = new Sequelize(
    DB_NAME,
    DB_USER,
    DB_PASSWORD,
    {
        host: DB_HOST,
        dialect: DB_DIALECT,
        logging: false,
    }
);

try {
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");
} catch (error) {
    console.error("Unable to connect to the database:", error);
}
export default sequelize;