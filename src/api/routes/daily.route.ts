import { Router } from "express";
import { db } from "../../config/database";

function findAvgByHour(
  hour: number,
  dailydust: {
    id: number;
    pm25Level: number;
    co2Level: number;
    location: string;
    timestamp: Date;
  }[]
) {
  const pm25Level = dailydust
    .filter((dust) => dust.timestamp.getHours() === hour)
    .map((dust) => dust.pm25Level);
  const co2Level = dailydust
    .filter((dust) => dust.timestamp.getHours() === hour)
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

const router = Router();

router.get("/daily-level", async (req, res) => {
  const { date } = req.query;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStartOfDay = new Date(yesterday.setHours(0, 0, 0, 0)); // Convert to Date object
  const todayStartOfDay = new Date().setHours(0, 0, 0, 0); // Today's start of day

  if (date) {
    const dailydust = await db.minuteDustLevel.findMany({
      where: {
        timestamp: {
          gte: new Date(date as string),
          lt: new Date(
            new Date(date as string).setDate(
              new Date(date as string).getDate() + 1
            )
          ), // Convert to Date object
        },
      },
    });

    const avgByHour = Array.from({ length: 24 }, (_, i) => {
      const { pm25, co2 } = findAvgByHour(i, dailydust);
      return {
        name: `${i}:00 น.`,
        pm25: pm25,
        co2: co2,
      };
    });

    return res.json(avgByHour);
  }

  const dailydust = await db.minuteDustLevel.findMany({
    where: {
      // Filter by timestamp greater than or equal to yesterday's 00:00:00 and less than today's 00:00:00
      timestamp: {
        gte: yesterdayStartOfDay, // Use the converted Date object
        lte: new Date(todayStartOfDay), // Convert to Date object
      },
    },
    orderBy: {
      timestamp: "asc",
    },
  });

  const avgByHour = Array.from({ length: 24 }, (_, i) => {
    const { pm25, co2 } = findAvgByHour(i, dailydust);
    return {
      name: `${i}:00 น.`,
      pm25: pm25,
      co2: co2,
    };
  });
  return res.json(avgByHour);
});

export { router as dailyRoute };
