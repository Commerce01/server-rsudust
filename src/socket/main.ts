import { createServer } from "http";
import { Server } from "socket.io";

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

    socket.on("event", (msg) => {
      //   console.log("co2: " + co2 + "pm25:" + pm25);
      //   socket.emit("count", co2, pm25);
      console.log("event", msg);
      socket.emit("event");
    });
  });

  return httpServer;
}

export default socketServer;
