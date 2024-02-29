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
  const minutedust = await db.minuteDustLevel.findMany();
  return res.json(minutedust);
});

export { router as minuteRoute };
