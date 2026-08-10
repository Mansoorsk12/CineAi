import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { askAssistant, type AiReply } from "./ai.server";

const Input = z.object({
  prompt: z.string().min(2).max(500),
  profile: z.string().max(1000).default(""),
});

export const recommendWithAi = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }): Promise<AiReply | { error: string }> => {
    try {
      const reply = await askAssistant(data.prompt, data.profile);
      if (reply) return reply;
      return { error: "UNAVAILABLE" };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "UNAVAILABLE" };
    }
  });
