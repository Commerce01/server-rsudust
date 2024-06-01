import { createServer } from "http";
import { Server } from "socket.io";
import { db } from "../config/database";

// ฟังก์ชันสำหรับสร้าง Socket Server
function socketServer() {
  const httpServer = createServer();
  // สร้าง HTTP Server
  const io = new Server(httpServer, {
    cors: {
      origin: "*", // อนุญาตการเชื่อมต่อจากทุกโดเมน (อาจจะต้องปรับแต่งตามความต้องการ)
    },
  });
  //  Event สำหรับการเชื่อมต่อของ client
  io.on("connection", (socket) => {
    console.log("a user connected");
    // Event สำหรับการ client ตัดการเชื่อมต่อ
    socket.on("disconnect", () => {
      console.log("user disconnected");
    });
    // ตั้งเวลาทำงานทุกๆ 5 วินาที (5000 มิลลิวินาที)
    setInterval(async () => {
      // ดึงข้อมูลค่าฝุ่นละออง PM2.5 และ CO2 ล่าสุด 1 รายการ
      // โดยเรียงลำดับข้อมูลตาม timestamp ล descending (ล่าสุด -> เก่าสุด)
      const minutelevel = await db.minuteDustLevel.findMany({
        orderBy: { timestamp: "desc" },
        take: 1,
      });
      console.log(
        "co2: " + minutelevel[0].co2Level + "pm25:" + minutelevel[0].pm25Level
      );
      // ส่งข้อมูล (ค่า CO2 และ PM2.5) ไปยัง client ผ่าน event "building-five"
      socket.emit(
        "building-five",
        minutelevel[0].co2Level,
        minutelevel[0].pm25Level
      );
    }, 5000);
    // console.log("event", msg);
    // socket.emit("event");
  });
  // ส่งกลับ HTTP Server
  return httpServer;
}
// Export ฟังก์ชัน socketServer เพื่อใช้งานภายนอก
export default socketServer;
