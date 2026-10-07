import { describe, expect, it } from "vitest";
import { confirmedSchema, requestInputSchema } from "@/lib/procurement";
describe("Procurement validation", () => {
  it("rejects an empty brief", () => { expect(requestInputSchema.safeParse({text:""}).success).toBe(false); });
  it("requires a confirmed budget and deadline", () => { expect(confirmedSchema.safeParse({raw_request:"Please make a restaurant video",brief:{service:"Restaurant video",category:"Video production",budget:null,currency:"USD",deadline_hours:null,requirements:["30 seconds"],clarification:null}}).success).toBe(false); });
  it("accepts a complete reviewed brief", () => { expect(confirmedSchema.safeParse({raw_request:"Please make a restaurant video",brief:{service:"Restaurant video",category:"Video production",budget:100,currency:"USD",deadline_hours:48,requirements:["30 seconds"],clarification:null}}).success).toBe(true); });
});