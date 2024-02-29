import { z } from "zod";
import "dotenv/config";

export const envSchema = z.object({
  API_PORT: z.string().default("8080"),
  SOCKET_PORT: z.string().default("5000"),
  LINE_ACCESS_TOKEN: z.string().default(""),
  LINE_CHANNEL_SECRET: z.string().default(""),
});
declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof envSchema> {}
  }
}

export const env = envSchema.parse(process.env);
export const getEnv = (key: keyof typeof env) => env[key];
