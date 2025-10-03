import dotenv from "dotenv";
import app from "./app";
import { AppDataSource } from "./database/config/data-source";
dotenv.config();

const port = process.env.PORT || 3007;
const serverIP = process.env.SERVER_IP || "localhost";

AppDataSource.initialize()
  .then(() => {
    console.log("Data Source has been initialized!");
    app.listen(port, () => {
      console.log(`Anasource server available at: http://${serverIP}:` + port);
      console.log(`Local server available at: http://localhost:` + port);
    });
  })
  .catch((err) => {
    console.error("Error during Data Source initialization:", err);
    process.exit(1);
  });
