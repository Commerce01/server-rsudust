import { Router } from "express";
import { db } from "../../config/database";

const router = Router();
router.post("/daily-level", async (req, res) => {
  const { pm25Level, co2Level } = req.body;

  const avgPm25 =
    pm25Level.reduce((acc: number, cur: number) => acc + cur, 0) /
    pm25Level.length;
  const avgCo2 =
    co2Level.reduce((acc: number, cur: number) => acc + cur, 0) /
    co2Level.length;

  const dailydust = await db.dailyDustLevel.create({
    data: {
      pm25Level,
      co2Level,
      avgpm25Level: avgPm25,
      avgco2Level: avgCo2,
    },
  });
  return res.json(dailydust);
});

router.get("/daily-level", async (req, res) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStartOfDay = new Date(yesterday.setHours(0, 0, 0, 0)); // Convert to Date object
  const todayStartOfDay = new Date().setHours(0, 0, 0, 0); // Today's start of day
  const dailydust = await db.dailyDustLevel.findFirst({
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

  return res.json(dailydust);
});

export { router as dailyRoute };
