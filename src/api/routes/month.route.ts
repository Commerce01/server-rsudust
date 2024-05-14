import { Router } from "express";
import { db } from "../../config/database";
import { MinuteDustLevel } from "@prisma/client";

const router = Router();

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

function calculateMonthlyAverage(
  dustData: MinuteDustLevel[],
  month: number
): { averageDust: number; averageCo2: number } | null {
  const filteredData = dustData.filter(
    (entry) => new Date(entry.timestamp).getMonth() === month
  );

  if (filteredData.length === 0) {
    return null;
  }

  const totalDust = filteredData.reduce(
    (acc: number, curr: MinuteDustLevel) => acc + curr.co2Level,
    0
  );
  const averageDust = totalDust / filteredData.length;

  const totalCo2 = filteredData.reduce(
    (acc: number, curr: MinuteDustLevel) => acc + curr.pm25Level,
    0
  );
  const averageCo2 = totalCo2 / filteredData.length;
  return { averageDust, averageCo2 };
}

function findAvgByDay(day: number, dailydust: MinuteDustLevel[]) {
  const pm25Level = dailydust
    .filter((dust) => new Date(dust.timestamp).getDate() === day)
    .map((dust) => dust.pm25Level);
  const co2Level = dailydust
    .filter((dust) => new Date(dust.timestamp).getDate() === day)
    .map((dust) => dust.co2Level);
  const avgPm25 =
    pm25Level.reduce((acc: number, cur: number) => acc + cur, 0) /
    pm25Level.length;
  const avgCo2 =
    co2Level.reduce((acc: number, cur: number) => acc + cur, 0) /
    co2Level.length;

  return {
    pm25: avgPm25,
    co2: avgCo2,
  };
}

router.get("/month-level", async (req, res) => {
  const { daily, month, year } = req.query;
  const today = new Date();
  const dailydust = await db.minuteDustLevel.findMany({
    orderBy: {
      timestamp: "asc",
    },
  });

  if (year) {
    const getYear = dailydust.filter(
      (d) => new Date(d.timestamp).getFullYear() === Number(year)
    );

    let arr = [];
    for (let i = 0; i < 12; i++) {
      const monthAverage = calculateMonthlyAverage(getYear, i);
      // if (monthAverage !== null) {
      //     console.log(`Average dust level for month ${i + 1}:`, monthAverage);
      // }
      arr.push({
        month: i + 1,
        pm25Average: monthAverage?.averageDust,
        co2Average: monthAverage?.averageCo2,
      });
    }

    const filteredArr = arr.filter(
      (entry) => entry.co2Average && entry.pm25Average !== null
    );

    return res.json(filteredArr);
  }

  if (month) {
    const getMonth = dailydust.filter(
      (d) => new Date(d.timestamp).getMonth() === Number(month) - 1
    );

    const avgByDay = Array.from({ length: 31 }, (_, i) => {
      const { pm25, co2 } = findAvgByDay(i + 1, getMonth);
      return {
        name: `${i + 1}/${Number(month)}/${today.getFullYear()}`,
        pm25: pm25,
        co2: co2,
      };
    });
    return res.json(avgByDay);
  }

  if (!dailydust || dailydust.length === 0) {
    console.error("No daily dust level data found!");
    return res.status(404).json({ error: "No daily dust level data found!" });
  }

  if (daily === "true") {
    const getMonth = dailydust.filter(
      (d) => new Date(d.timestamp).getMonth() === Number(today.getMonth())
    );

    const avgByDay = Array.from({ length: 31 }, (_, i) => {
      const { pm25, co2 } = findAvgByDay(i + 1, getMonth);
      return {
        name: `${i + 1}/${today.getMonth() + 1}/${today.getFullYear()}`,
        pm25: pm25,
        co2: co2,
      };
    });
    return res.json(avgByDay);
  }

  let arr = [];
  for (let i = 0; i < 12; i++) {
    const monthAverage = calculateMonthlyAverage(dailydust, i);
    // if (monthAverage !== null) {
    //     console.log(`Average dust level for month ${i + 1}:`, monthAverage);
    // }
    arr.push({
      name: monthsThai[i],
      pm25: monthAverage?.averageDust || null,
      co2: monthAverage?.averageCo2 || null,
    });
  }

  const filteredArr = arr.filter((entry) => entry.co2 && entry.pm25 !== null);

  return res.json(arr);
});

export { router as monthRoute };
