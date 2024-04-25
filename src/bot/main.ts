import * as line from "@line/bot-sdk";
import { getEnv } from "../config/env";
import express from "express";
import { db } from "../config/database";

const app = express();

export default function botServer() {
  return app;
}

app.post(
  "/webhook",
  line.middleware({
    channelSecret: getEnv("LINE_CHANNEL_SECRET"),
    channelAccessToken: getEnv("LINE_ACCESS_TOKEN"),
  }),
  (req, res) => {
    Promise.all(req.body.events.map(handleEvent))
      .then(() => res.json({ success: true }))
      .catch((err) => {
        console.error(err);
        res.status(500).json({ success: false });
      });
  }
);

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: getEnv("LINE_ACCESS_TOKEN"),
});

const handleEvent = async (event: line.WebhookEvent) => {
  if (event.type !== "message" || event.message.type !== "text") {
    return Promise.resolve(null);
  }

  const minutelevel = await db.minuteDustLevel.findMany({
    orderBy: { timestamp: "desc" },
    take: 1,
  });

  if (event.message.text === "อาคาร5") {
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
                text: `ค่า ${minutelevel[0].pm25Level}`,
                actions: [
                  {
                    type: "uri",
                    label: "รายละเอียดเพิ่มเติม",
                    uri: "https://www.youtube.com/",
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
                    uri: "https://www.youtube.com/",
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
                    uri: "https://www.youtube.com/",
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
                    uri: "https://www.youtube.com/",
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
