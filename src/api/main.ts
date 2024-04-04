import express from "express";
import { minuteRoute } from "./routes/minute.route";
import { dailyRoute } from "./routes/daily.route";
import { monthRoute } from "./routes/month.route";
import cors from "cors";

function Server() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
  );
  app.use("/api", minuteRoute);
  app.use("/api", dailyRoute);
  app.use("/api", monthRoute);

  return app;
}

export default Server;
