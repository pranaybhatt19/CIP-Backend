import { DataSource } from "typeorm";
import dotenv from "dotenv";
dotenv.config();

const dbPort = process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432;

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: dbPort,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: false,
  logging: false,
  entities: [],
  migrations: ["src/database/migrations/*.ts", "src/database/seeders/*.ts"],
  subscribers: [],
});
