import * as line from "@line/bot-sdk";
import { Router } from "express";
import { getEnv } from "../config/env";

const router = Router();

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: getEnv("LINE_ACCESS_TOKEN"),
});

function handleEvent(event: line.WebhookEvent) {
  if (event.type !== "message" || event.message.type !== "text") {
    return Promise.resolve(null);
  }

  return client.replyMessage({
    replyToken: event.replyToken,
    messages: [
      {
        type: "text",
        text: event.message.text,
      },
    ],
  });
}

router.post(
  "/webhook",
  line.middleware({
    channelSecret: getEnv("LINE_CHANNEL_SECRET"),
    channelAccessToken: getEnv("LINE_ACCESS_TOKEN"),
  }),
  (req, res) => {
    Promise.all(req.body.events.map(handleEvent)).then((result) =>
      res.json(result)
    );
  }
);

export { router as webhook };
