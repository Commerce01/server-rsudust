import { getEnv } from "./config/env";
import Server from "./api/main";
import socketServer from "./socket/main";
import botServer from "./bot/main";

function main() {
  const api = Server();
  const socket = socketServer();
  const bot = botServer();

  api.listen(getEnv("API_PORT"), () => {
    try {
      console.log("✅ Server is running on port " + getEnv("API_PORT"));
    } catch (e) {
      console.log(e);
    }
  });

  socket.listen(getEnv("SOCKET_PORT"), () => {
    try {
      console.log("✅ Socket is running on port " + getEnv("SOCKET_PORT"));
    } catch (e) {
      console.log(e);
    }
  });

  bot.listen(getEnv("BOT_PORT"), () => {
    try {
      console.log("✅ Line Bot is running on port " + getEnv("BOT_PORT"));
    } catch (error) {
      console.log(error);
    }
  });
}

main();
