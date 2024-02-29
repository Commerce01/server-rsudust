import { createServer } from "http";
import { Server } from "socket.io";
import { db } from "../config/database";

function socketServer() {
  const httpServer = createServer();
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log("a user connected");
    socket.on("disconnect", () => {
      console.log("user disconnected");
    });

    setInterval(async () => {
      const minutelevel = await db.minuteDustLevel.findMany({
        orderBy: { timestamp: "desc" },
        take: 1,
      });
      console.log(
        "co2: " + minutelevel[0].co2Level + "pm25:" + minutelevel[0].pm25Level
      );
      socket.emit(
        "building-five",
        minutelevel[0].co2Level,
        minutelevel[0].pm25Level
      );
    }, 1000 * 60);
    // console.log("event", msg);
    // socket.emit("event");
  });
  return httpServer;
}

export default socketServer;
