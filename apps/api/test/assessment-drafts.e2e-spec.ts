import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { normalizeQuestions } = require("../database/seeds/assessment/generate-drafts.cjs") as {
  normalizeQuestions: (input: unknown, prefix: string) => Array<{ status: string; correctOptionId: string }>;
};

describe("FR-TST-01 offline draft normalization", () => {
  const valid = {
    prompt: "Where should a bounding box be drawn?",
    difficulty: "MEDIUM",
    options: ["Around the complete visible object", "Around its shadow", "Around the frame", "Around its center"],
    correctIndex: 0,
  };

  it("forces every model item to DRAFT with a stable answer ID", () => {
    const questions = normalizeQuestions({ questions: [valid] }, "demo");
    expect(questions).toMatchObject([{ id: "demo-1", kind: "MCQ", status: "DRAFT", correctOptionId: "a" }]);
  });

  it("rejects invalid model answer keys before any database write", () => {
    expect(() => normalizeQuestions({ questions: [{ ...valid, correctIndex: 4 }] }, "demo")).toThrow();
  });
});
