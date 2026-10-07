import { z } from "zod";

export const extractedSchema = z.object({
  service: z.string(), category: z.string(), budget: z.number().nullable(), currency: z.string(), deadline_hours: z.number().nullable(), requirements: z.array(z.string()), clarification: z.string().nullable(),
});
export type Brief = z.infer<typeof extractedSchema>;
export const requestInputSchema = z.object({ text: z.string().trim().min(15, "Please add a little more detail (at least 15 characters).").max(4000) });
export const confirmedSchema = z.object({
  raw_request: z.string().trim().min(15).max(4000),
  brief: z.object({ service: z.string().trim().min(3).max(200), category: z.string().trim().min(2).max(100), budget: z.number().positive().max(1000000), currency: z.enum(["USD", "EUR", "GBP"]), deadline_hours: z.number().positive().max(8760), requirements: z.array(z.string().trim().min(1).max(500)).min(1).max(20), clarification: z.string().nullable() }),
});
export const examples = [
  { title: "A video that gets noticed", category: "Video production", text: "I need a 30-second promotional video for my restaurant. Budget $100. I need it within 48 hours. Include music and captions.", icon: "video" },
  { title: "A brand worth remembering", category: "Brand & design", text: "I need a modern logo for my new coffee shop. My budget is $150 and I need it within 5 days. Include two concepts and source files.", icon: "design" },
  { title: "A website that converts", category: "Web development", text: "Build a responsive landing page for my fitness studio with a booking form. Budget $300, delivery within 7 days.", icon: "web" },
];