import { Router } from "express"; // Import Router class สำหรับกำหนด routes ของ API
import { db } from "../../config/database"; // Import database connection object (น่าจะมาจากไฟล์แยก)

// ฟังก์ชันสำหรับคำนวณค่าเฉลี่ยของ PM2.5 และ CO2 ในแต่ละชั่วโมง
function findAvgByHour(
  hour: number, // ชั่วโมงของวัน (0-23)
  dailydust: {
    id: number;
    pm25Level: number;
    co2Level: number;
    location: string;
    timestamp: Date;
  }[] // Array ของ object ข้อมูลฝุ่นละอองสำหรับหนึ่งวัน
) {
  // กรองข้อมูลฝุ่นละอองสำหรับชั่วโมงที่ระบุ
  const pm25Level = dailydust
    .filter((dust) => dust.timestamp.getHours() === hour) // กรองตามชั่วโมง
    .map((dust) => dust.pm25Level); // ดึงค่า PM2.5
  const co2Level = dailydust
    .filter((dust) => dust.timestamp.getHours() === hour) // กรองตามชั่วโมง
    .map((dust) => dust.co2Level); // ดึงค่า PM2.5

  // คำนวณค่าเฉลี่ย PM2.5 และ CO2
  const avgPm25 =
    pm25Level.reduce((acc: number, cur: number) => acc + cur, 0) /
    pm25Level.length; // คำนวณค่าเฉลี่ย PM2.5
  const avgCo2 =
    co2Level.reduce((acc: number, cur: number) => acc + cur, 0) /
    co2Level.length; // คำนวณค่าเฉลี่ย CO2

  // ส่งคืน object ที่ประกอบด้วยค่าเฉลี่ย
  return {
    pm25: avgPm25,
    co2: avgCo2,
  };
}
// สร้าง instance ใหม่ของ Router class สำหรับจัดการ routes เกี่ยวกับระดับรายวัน
const router = Router();
// GET Route handler สำหรับ "/daily-level" ดึงค่าเฉลี่ย PM2.5 และ CO2 รายวัน แยกตามชั่วโมง
router.get("/daily-level", async (req, res) => {
  // แยกค่าพารามิเตอร์ "date" จาก request query
  const { date } = req.query;
  // คำนวณวันที่เมื่อวาน
  const yesterday = new Date();

  yesterday.setDate(yesterday.getDate() - 1);
  // ตั้งค่า timestamp สำหรับจุดเริ่มต้นของเมื่อวานและวันนี้
  const yesterdayStartOfDay = new Date(yesterday.setHours(0, 0, 0, 0)); // แปลงเป็น Date object
  const todayStartOfDay = new Date().setHours(0, 0, 0, 0); // แปลงเป็น Date object

  // จัดการ request ที่มีพารามิเตอร์ "date" ระบุ
  if (date) {
    const today = new Date(date as string);
    const startDate = new Date(today.setHours(0, 0, 0, 0));
    const endDate = new Date(today.setHours(23, 59, 59, 999));
    // กรองข้อมูลฝุ่นละอองสำหรับช่วงวันที่ระบุ (จากวันที่ร้องขอถึงวันถัดไป)
    const dailydust = await db.minuteDustLevel.findMany({
      where: {
        timestamp: {
          // gte: new Date(date as string), // กรองจากวันที่ร้องขอ
          gte: startDate,
          lt: endDate,
          // lt: new Date( // กรองถึงวันถัดไป
          //   new Date(date as string).setDate(
          //     new Date(date as string).getDate() + 1 // เพิ่ม 1 วัน
          //   )
          // ), // Convert to Date object
        },
      },
    });
    // console.log(dailydust);
    console.log(startDate);
    console.log(new Date());
    // คำนวณค่าเฉลี่ย PM2.5 และ CO2 แยกตามชั่วโมงสำหรับข้อมูลที่กรองแล้ว
    const avgByHour = Array.from({ length: 24 }, (_, i) => {
      // เรียกใช้ฟังก์ชัน helper เพื่อหาค่าเฉลี่ย
      const { pm25, co2 } = findAvgByHour(i, dailydust);
      // ปรับชั่วโมงให้ตรงกับไทม์โซนประเทศไทย (UTC+7)
      const changeTimeZone = i;
      // สร้างข้อมูลสำหรับผลลัพธ์แต่ละชั่วโมง
      return {
        name: `${changeTimeZone}:00 น.`, // ชื่อแกน X แสดงเป็นเวลา xx:00 น. โดยปรับตาม timezone (+7 ชั่วโมง)
        pm25: pm25, // ค่า PM2.5 เฉลี่ย
        co2: co2, // ค่า CO2 เฉลี่ย
      };
    });

    return res.json(avgByHour);
  }

  const dailydust = await db.minuteDustLevel.findMany({
    where: {
      // กรองข้อมูลตาม timestamp ตั้งแต่ 00:00:00 ของเมื่อวาน (รวมเวลา)
      //  จนถึง 00:00:00 ของวันนี้ (ไม่รวมเวลา)
      timestamp: {
        gte: yesterdayStartOfDay, // ใช้ yesterdayStartOfDay (ซึ่งน่าจะเป็นวันที่คำนวณ)
        lte: new Date(todayStartOfDay), // แปลง todayStartOfDay เป็น Date object
      },
    },
    orderBy: {
      timestamp: "asc", // เรียงลำดับข้อมูลตาม timestamp จากน้อยไปมาก
    },
  });
  // สร้างข้อมูลสำหรับผลลัพธ์ 24 ชั่วโมง
  const avgByHour = Array.from({ length: 24 }, (_, i) => {
    const { pm25, co2 } = findAvgByHour(i, dailydust);
    const changeTimeZone = i;
    return {
      name: `${changeTimeZone}:00 น.`,
      pm25: pm25,
      co2: co2,
    };
  });
  // ส่งผลลัพธ์ (avgByHour) เป็น JSON response
  return res.json(avgByHour);
});

export { router as dailyRoute };
