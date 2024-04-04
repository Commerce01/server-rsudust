import { Router } from "express";
import { db } from "../../config/database";
import { DailyDustLevel } from "@prisma/client";

const router = Router();

router.get("/month-level", async (req, res) => {
  const dailydust = await db.dailyDustLevel.findMany();

  if (!dailydust || dailydust.length === 0) {
    console.error("No daily dust level data found!");
    return null;
  }

  function calculateMonthlyAverage(
    dustData: DailyDustLevel[],
    month: number
  ): { averageDust: number; averageCo2: number } | null {
    const filteredData = dustData.filter(
      (entry) => new Date(entry.timestamp).getMonth() === month
    );

    if (filteredData.length === 0) {
      return null;
    }

    const totalDust = filteredData.reduce(
      (acc: number, curr: DailyDustLevel) => acc + curr.avgpm25Level,
      0
    );
    const averageDust = totalDust / filteredData.length;

    const totalCo2 = filteredData.reduce(
      (acc: number, curr: DailyDustLevel) => acc + curr.avgco2Level,
      0
    );
    const averageCo2 = totalCo2 / filteredData.length;
    return { averageDust, averageCo2 };
  }

  let arr = [];
  for (let i = 0; i < 12; i++) {
    const monthAverage = calculateMonthlyAverage(dailydust, i);
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
});

export { router as monthRoute };
