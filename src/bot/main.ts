import * as line from "@line/bot-sdk";
import { getEnv } from "../config/env";
import express from "express";
import { db } from "../config/database";

// สร้าง app instance ของ express framework
const app = express();
// ฟังก์ชันสำหรับสร้าง Line bot server
export default function botServer() {
  return app; // ส่งคืน app instance เพื่อใช้งานภายนอกฟังก์ชัน
}
// กำหนด middleware ของ line.bot-sdk สำหรับ route "/webhook"
app.post(
  "/webhook",
  line.middleware({
    channelSecret: getEnv("LINE_CHANNEL_SECRET"), // ตั้งค่า channelSecret จากค่าแวดล้อม LINE_CHANNEL_SECRET
    channelAccessToken: getEnv("LINE_ACCESS_TOKEN"), // ตั้งค่า channelAccessToken จากค่าแวดล้อม LINE_ACCESS_TOKEN
  }),
  (req, res) => {
    // ประมวลผล event ทั้งหมดจาก LINE API
    Promise.all(req.body.events.map(handleEvent))
      .then(() => res.json({ success: true })) // ส่ง response แจ้งผลสำเร็จ
      .catch((err) => {
        console.error(err); // แสดง error message บน console
        res.status(500).json({ success: false }); // ส่ง response แจ้งผลล้มเหลว
      });
  }
);
// สร้าง instance ของ line.messagingApi.MessagingApiClient
const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: getEnv("LINE_ACCESS_TOKEN"), // ตั้งค่า channelAccessToken จากค่าแวดล้อม LINE_ACCESS_TOKEN
});
// ฟังก์ชันสำหรับจัดการ event จาก LINE API
const handleEvent = async (event: line.WebhookEvent) => {
  // กรอง event ประเภท "message" และ "text"
  if (event.type !== "message" || event.message.type !== "text") {
    return Promise.resolve(null); // ไม่ดำเนินการต่อ
  }
  // ดึงข้อมูลค่าฝุ่นละอองและ CO2 ล่าสุด 1 รายการจากฐานข้อมูล
  const minutelevel = await db.minuteDustLevel.findMany({
    orderBy: { timestamp: "desc" }, // เรียงลำดับข้อมูลจากล่าสุดไปเก่าสุด
    take: 1, // ดึงข้อมูล 1 รายการ
  });

  if (event.message.text === "อาคาร5") {
    return client.replyMessage({
      replyToken: event.replyToken, // ตั้งค่า replyToken จาก event
      messages: [
        {
          type: "template", // ส่งข้อความแบบ template
          altText: "cannot display template message",
          template: {
            type: "carousel", // แสดงข้อความแบบ carousel
            columns: [
              {
                title: "ค่า PM 2.5",
                text: `ค่า ${minutelevel[0].pm25Level}`,
                actions: [
                  {
                    type: "uri",
                    label: "รายละเอียดเพิ่มเติม",
                    uri: "http://air4thai.pcd.go.th/webV3/#/AQIInfo",
                  },
                ],
              },
              {
                title: "ค่า CO2",
                text: `ค่า ${minutelevel[0].co2Level}`,
                actions: [
                  {
                    type: "uri",
                    label: "รายละเอียดเพิ่มเติม",
                    uri: "http://air4thai.pcd.go.th/webV3/#/AQIInfo",
                  },
                ],
              },
            ],
          },
        },
      ],
    });
  }

  if (event.message.text === "อาคาร6") {
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [
        {
          type: "template",
          altText: "cannot display template message",
          template: {
            type: "carousel",
            columns: [
              {
                title: "ค่า PM 2.5",
                text: "ค่า  เท่านี้",
                actions: [
                  {
                    type: "uri",
                    label: "รายละเอียดเพิ่มเติม",
                    uri: "http://air4thai.pcd.go.th/webV3/#/AQIInfo",
                  },
                ],
              },
              {
                title: "ค่า CO2",
                text: "ค่า  เท่านี้",
                actions: [
                  {
                    type: "uri",
                    label: "รายละเอียดเพิ่มเติม",
                    uri: "http://air4thai.pcd.go.th/webV3/#/AQIInfo",
                  },
                ],
              },
            ],
          },
        },
      ],
    });
  }

  return Promise.resolve(null);

  //   return client.replyMessage({
  //     replyToken: event.replyToken,
  //     messages: [
  //       {
  //         type: "text",
  //         text: event.message.text,
  //       },
  //     ],
  //   });
};
