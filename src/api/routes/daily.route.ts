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
  const minutedust = await db.dailyDustLevel.findMany();
  return res.json(minutedust);
});

export { router as dailyRoute };
