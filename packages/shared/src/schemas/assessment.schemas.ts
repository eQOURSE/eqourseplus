import { z } from "zod";

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const percent = z.number().int().min(0).max(100);

export const testConfigSchema = z.object({
  taxonomySlug: slug,
  timeLimitSeconds: z.number().int().positive(),
  questionCount: z.number().int().positive(),
  passThresholdPercent: percent,
  cooldownDays: z.number().int().nonnegative().default(14),
  maxAttempts: z.number().int().positive().default(2),
  tierBands: z.object({ silverMinPercent: percent, goldMinPercent: percent }),
}).strict();

export const testQuestionSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("MCQ"),
  status: z.literal("DRAFT"),
  prompt: z.string().min(1),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  options: z.array(z.object({ id: z.string().min(1), text: z.string().min(1) }).strict()).length(4),
  correctOptionId: z.string().min(1),
}).strict();

export const testAnswersSchema = z.object({
  answers: z.array(z.object({ questionId: z.string().min(1), optionId: z.string().min(1) }).strict()),
}).strict();

export const testViolationSchema = z.object({
  kind: z.enum(["FULLSCREEN_EXIT", "TAB_SWITCH", "WINDOW_BLUR"]),
}).strict();

export type TestConfigInput = z.infer<typeof testConfigSchema>;
export type TestQuestionInput = z.infer<typeof testQuestionSchema>;
export type TestAnswersInput = z.infer<typeof testAnswersSchema>;
export type TestViolationInput = z.infer<typeof testViolationSchema>;
