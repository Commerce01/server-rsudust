import { Router } from "express"; // นำเข้า Router class จาก Express framework
import { db } from "../../config/database"; // นำเข้าตัวแปร db จากไฟล์ config/database.js

const router = Router(); // สร้าง instance ใหม่ของ Router class
// POST Route (สร้างข้อมูลฝุ่นละออง PM2.5 และ CO2 ระดับนาที)
router.post("/minute-level", async (req, res) => {
  const { pm25Level, co2Level } = req.body; // แยกค่า pm25Level และ co2Level จาก request body
  const minutedust = await db.minuteDustLevel.create({
    data: {
      pm25Level, // เก็บค่า pm25Level ลงใน database
      co2Level, // เก็บค่า co2Level ลงใน database
    },
  });
  return res.json(minutedust); // ส่ง JSON response กลับไปยังไคลเอนต์ ประกอบด้วย object minutedust ที่สร้างใหม่
});

// GET Route (ดึงข้อมูลฝุ่นละออง PM2.5 และ CO2 ระดับนาที)
router.get("/minute-level", async (req, res) => {
  const { hour } = req.query; // แยกค่า hour จาก request query
  const td = new Date().setHours(0, 0, 0, 0); // ตั้งค่า td เป็นวันที่ปัจจุบัน เวลาเที่ยงคืน
  const today = new Date().getHours(); // หาชั่วโมงปัจจุบัน
  const todaySet = new Date().setHours(today, 0, 0, 0); // ตั้งค่า todaySet เป็นวันที่ปัจจุบัน ต้นชั่วโมงปัจจุบัน
  const date = new Date(todaySet); // สร้าง date จาก todaySet
  const minutedust = await db.minuteDustLevel.findMany({
    where: {
      timestamp: {
        gte: date, // กรองข้อมูลที่มี timestamp มากกว่าหรือเท่ากับ date
      },
    },
  });

  if (hour) {
    const minuteDust = await db.minuteDustLevel.findMany({
      where: {
        timestamp: {
          gt: new Date(td), // กรองข้อมูลที่มี timestamp มากกว่า td
        },
      },
    });

    const getHour = minuteDust.filter(
      (d) => new Date(d.timestamp).getHours() === Number(hour) // กรองข้อมูลตามชั่วโมงที่ระบุ
    );

    const getMinute = getHour.map((d) => {
      return {
        ...d, // เก็บข้อมูลเดิม
        minute: new Date(d.timestamp).getMinutes(), // เพิ่มค่า minute
      };
    });

    return res.json(getMinute); // ส่ง JSON response กลับไปยังไคลเอนต์ ประกอบด้วย object getMinute
  }

  const getMinute = minutedust.map((d) => {
    return {
      ...d, // เก็บข้อมูลเดิม
      minute: new Date(d.timestamp).getMinutes(), // เพิ่มค่า minute
    };
  });

  return res.json(getMinute); // ส่ง JSON response กลับไปยังไคลเอนต์ ประกอบด้วย object getMinute
});

export { router as minuteRoute }; // ส่งออก router สำหรับการใช้งานในไฟล์อื่น
