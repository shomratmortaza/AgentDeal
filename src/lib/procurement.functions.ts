import { createServerFn } from "@tanstack/react-start";
import { requestInputSchema } from "./procurement";

export const extractBrief = createServerFn({ method: "POST" })
  .inputValidator((input) => requestInputSchema.parse(input))
  .handler(async ({ data }) => {
    const { extractRequirements } = await import("./procurement.server");
    return extractRequirements(data.text);
  });

