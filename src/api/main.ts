import express from "express";
import { webhook } from "../bot/main";
import { minuteRoute } from "./routes/minute.route";

function Server() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(webhook);
  app.use("/api", minuteRoute);

  return app;
}

export default Server;
