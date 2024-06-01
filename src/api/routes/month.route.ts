import { Router } from "express"; // Import Router class สำหรับกำหนด routes ของ API
import { db } from "../../config/database"; // Import database connection object (น่าจะมาจากไฟล์แยก)
import { MinuteDustLevel } from "@prisma/client"; // Import type สำหรับโครงสร้างข้อมูลฝุ่นละออง

// สร้าง instance ใหม่ของ Router class สำหรับจัดการ routes เกี่ยวกับระดับรายเดือน
const router = Router();
// คำอธิบายรายการเดือนภาษาไทย (มกราคม - ธันวาคม)
const monthsThai = [
  "มกราคม", // January
  "กุมภาพันธ์", // February
  "มีนาคม", // March
  "เมษายน", // April
  "พฤษภาคม", // May
  "มิถุนายน", // June
  "กรกฎาคม", // July
  "สิงหาคม", // August
  "กันยายน", // September
  "ตุลาคม", // October
  "พฤศจิกายน", // November
  "ธันวาคม", // December
];
// ฟังก์ชันคำนวณค่าเฉลี่ยของฝุ่นละอองและ CO2 รายเดือน
function calculateMonthlyAverage(
  dustData: MinuteDustLevel[], // Array ของข้อมูลฝุ่นละอองรายวัน
  month: number // เดือนที่ต้องการคำนวณ (0 = มกราคม, 11 = ธันวาคม)
): { averageDust: number; averageCo2: number } | null {
  // กรองข้อมูลฝุ่นละอองเฉพาะเดือนที่ระบุ
  const filteredData = dustData.filter(
    (entry) => new Date(entry.timestamp).getMonth() === month
  );
  // กรณีไม่เจอข้อมูลประจำเดือนนั้น
  if (filteredData.length === 0) {
    return null;
  }
  // คำนวณค่า CO2 เฉลี่ยรายเดือน
  const totalDust = filteredData.reduce(
    (acc: number, curr: MinuteDustLevel) => acc + curr.co2Level,
    0
  );
  const averageDust = totalDust / filteredData.length;
  // คำนวณค่า PM2.5 เฉลี่ยรายเดือน
  const totalCo2 = filteredData.reduce(
    (acc: number, curr: MinuteDustLevel) => acc + curr.pm25Level,
    0
  );
  const averageCo2 = totalCo2 / filteredData.length;
  // ส่งคืน object ที่ประกอบด้วยค่าเฉลี่ย CO2 และ PM2.5
  return { averageDust, averageCo2 };
}
// ฟังก์ชันคำนวณค่าเฉลี่ยของฝุ่นละอองและ CO2 รายวัน
function findAvgByDay(day: number, dailydust: MinuteDustLevel[]) {
  // กรองข้อมูลฝุ่นละอองสำหรับวันที่ระบุ
  const pm25Level = dailydust
    .filter((dust) => new Date(dust.timestamp).getDate() === day)
    .map((dust) => dust.pm25Level);
  const co2Level = dailydust
    .filter((dust) => new Date(dust.timestamp).getDate() === day)
    .map((dust) => dust.co2Level);
  // คำนวณค่า PM2.5 เฉลี่ยรายวัน
  const avgPm25 =
    pm25Level.reduce((acc: number, cur: number) => acc + cur, 0) /
    pm25Level.length;
  const avgCo2 =
    co2Level.reduce((acc: number, cur: number) => acc + cur, 0) /
    co2Level.length;
  // ส่งคืน object ที่ประกอบด้วยค่าเฉลี่ย CO2 และ PM2.5
  return {
    pm25: avgPm25,
    co2: avgCo2,
  };
}
// Route handler สำหรับ "/month-level" เพื่อดึงข้อมูลค่าเฉลี่ยฝุ่นละอองและ CO2 รายเดือน
router.get("/month-level", async (req, res) => {
  // แยกค่าพารามิเตอร์ "daily", "month", "year" จาก request query
  const { daily, month, year } = req.query;
  const today = new Date();

  const dailydust = await db.minuteDustLevel.findMany({
    // เรียงลำดับข้อมูลตาม timestamp จากน้อยไปมาก
    orderBy: {
      timestamp: "asc",
    },
  });
  // กรณีมีการระบุปี (year) ใน query parameter
  if (year) {
    // กรองข้อมูลรายวัน โดยเก็บเฉพาะปีที่ตรงกับปีที่ระบุ (year)
    const getYear = dailydust.filter(
      (d) => new Date(d.timestamp).getFullYear() === Number(year)
    );

    let arr = [];
    // วนลูปประจำเดือน (1-12)
    for (let i = 0; i < 12; i++) {
      // คำนวณค่าเฉลี่ยรายเดือน (ฟังก์ชัน calculateMonthlyAverage)
      const monthAverage = calculateMonthlyAverage(getYear, i);
      // if (monthAverage !== null) {
      //     console.log(`Average dust level for month ${i + 1}:`, monthAverage);
      // }
      // สร้างข้อมูลผลลัพธ์ประจำเดือน
      arr.push({
        month: i + 1,
        pm25Average: monthAverage?.averageDust, // ค่า PM2.5 เฉลี่ย (อาจเป็น null กรณีไม่มีข้อมูล)
        co2Average: monthAverage?.averageCo2, // ค่า CO2 เฉลี่ย (อาจเป็น null กรณีไม่มีข้อมูล)
      });
    }
    // กรองข้อมูลอีกครั้ง เอาเฉพาะเดือนที่มีค่าทั้ง pm25Average และ co2Average
    const filteredArr = arr.filter(
      (entry) => entry.co2Average && entry.pm25Average !== null
    );
    // ส่งผลลัพธ์ (filteredArr) เป็น JSON response
    return res.json(filteredArr);
  }
  // กรณีมีการระบุเดือน (month) ใน query parameter
  if (month) {
    // กรองข้อมูลรายวัน โดยเก็บเฉพาะเดือนที่ตรงกับเดือนที่ระบุ (month)
    const getMonth = dailydust.filter(
      (d) => new Date(d.timestamp).getMonth() === Number(month) - 1
    );
    // สร้างข้อมูลผลลัพธ์รายวัน (1-31)
    const avgByDay = Array.from({ length: 31 }, (_, i) => {
      // คำนวณค่าเฉลี่ยรายวัน (ฟังก์ชัน findAvgByDay)
      const { pm25, co2 } = findAvgByDay(i + 1, getMonth);
      return {
        name: `${i + 1}/${Number(month)}/${today.getFullYear()}`,
        pm25: pm25, // ค่า PM2.5 เฉลี่ย
        co2: co2, // ค่า CO2 เฉลี่ย
      };
    });
    // ส่งผลลัพธ์ (avgByDay) เป็น JSON response
    return res.json(avgByDay);
  }
  // กรณีไม่มีข้อมูลรายวัน (dailydust = [])
  if (!dailydust || dailydust.length === 0) {
    console.error("No daily dust level data found!");
    // ส่ง error message (404 Not Found) เป็น JSON response
    return res.status(404).json({ error: "No daily dust level data found!" });
  }
  // กรณีมีการระบุ query parameter "daily=true"
  if (daily === "true") {
    // กรองข้อมูลรายวัน โดยเก็บเฉพาะเดือนที่ตรงกับเดือนปัจจุบัน
    const getMonth = dailydust.filter(
      (d) => new Date(d.timestamp).getMonth() === Number(today.getMonth())
    );
    // สร้างข้อมูลผลลัพธ์รายวัน (1-31)
    const avgByDay = Array.from({ length: 31 }, (_, i) => {
      // คำนวณค่าเฉลี่ยรายวันของ PM2.5 และ CO2 (ฟังก์ชัน findAvgByDay)
      const { pm25, co2 } = findAvgByDay(i + 1, getMonth);
      return {
        name: `${i + 1}/${today.getMonth() + 1}/${today.getFullYear()}`, // วันที่ (รูปแบบ dd/mm/yyyy) โดยใช้เดือนปัจจุบัน (today.getMonth())
        pm25: pm25, // ค่า PM2.5 เฉลี่ย
        co2: co2, // ค่า CO2 เฉลี่ย
      };
    });
    // ส่งผลลัพธ์ (avgByDay) เป็น JSON response
    return res.json(avgByDay);
  }
  // กรณีไม่ได้ระบุปีหรือเดือน แต่มีข้อมูลรายวัน
  let arr = [];
  for (let i = 0; i < 12; i++) {
    // คำนวณค่าเฉลี่ยรายเดือนของ PM2.5 และ CO2 (ฟังก์ชัน calculateMonthlyAverage)
    const monthAverage = calculateMonthlyAverage(dailydust, i);
    // if (monthAverage !== null) {
    //     console.log(`Average dust level for month ${i + 1}:`, monthAverage);
    // }
    // สร้างข้อมูลผลลัพธ์ประจำเดือน (ชื่อเดือนภาษาไทย, ค่าเฉลี่ย)
    arr.push({
      name: monthsThai[i], // ชื่อเดือนภาษาไทย (ม.ค. - ธ.ค.)
      pm25: monthAverage?.averageDust || null, // ค่า PM2.5 เฉลี่ย (อาจเป็น null กรณีไม่มีข้อมูล)
      co2: monthAverage?.averageCo2 || null, // ค่า CO2 เฉลี่ย (อาจเป็น null กรณีไม่มีข้อมูล)
    });
  }
  // กรองข้อมูลอีกครั้ง เอาเฉพาะเดือนที่มีค่าทั้ง pm25Average และ co2Average
  const filteredArr = arr.filter((entry) => entry.co2 && entry.pm25 !== null);
  // **(แก้ไข)** ส่งผลลัพธ์ทั้งหมด (arr) เป็น JSON response
  // เดิมส่งแค่ filteredArr ซึ่งอาจจะกรองข้อมูลออกจนเหลือ 0
  return res.json(arr);
});

export { router as monthRoute };
