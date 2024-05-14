import { Router } from "express";
import { db } from "../../config/database";

const router = Router();
router.post("/minute-level", async (req, res) => {
  const { pm25Level, co2Level } = req.body;
  const minutedust = await db.minuteDustLevel.create({
    data: {
      pm25Level,
      co2Level,
    },
  });
  return res.json(minutedust);
});

router.get("/minute-level", async (req, res) => {
  const { hour } = req.query;
  const td = new Date().setHours(0, 0, 0, 0);
  const today = new Date().getHours();
  const todaySet = new Date().setHours(today, 0, 0, 0);
  const date = new Date(todaySet);
  const minutedust = await db.minuteDustLevel.findMany({
    where: {
      timestamp: {
        gte: date,
      },
    },
  });

  if (hour) {
    const minuteDust = await db.minuteDustLevel.findMany({
      where: {
        timestamp: {
          gt: new Date(td),
        },
      },
    });

    const getHour = minuteDust.filter(
      (d) => new Date(d.timestamp).getHours() === Number(hour)
    );

    const getMinute = getHour.map((d) => {
      return {
        ...d,
        minute: new Date(d.timestamp).getMinutes(),
      };
    });

    return res.json(getMinute);
  }

  const getMinute = minutedust.map((d) => {
    return {
      ...d,
      minute: new Date(d.timestamp).getMinutes(),
    };
  });

  return res.json(getMinute);
});

export { router as minuteRoute };
