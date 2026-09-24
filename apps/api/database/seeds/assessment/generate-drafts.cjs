const { connect, disconnect } = require("mongoose");

const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          prompt: { type: "string" },
          difficulty: { type: "string", enum: ["EASY", "MEDIUM", "HARD"] },
          options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
          correctIndex: { type: "integer", minimum: 0, maximum: 3 },
        },
        required: ["prompt", "difficulty", "options", "correctIndex"],
      },
    },
  },
  required: ["questions"],
};

function normalizeQuestions(input, prefix) {
  if (!input || !Array.isArray(input.questions) || !input.questions.length) throw new Error("No questions returned");
  return input.questions.map((item, index) => {
    if (!item || typeof item.prompt !== "string" || !item.prompt.trim() ||
      !["EASY", "MEDIUM", "HARD"].includes(item.difficulty) ||
      !Array.isArray(item.options) || item.options.length !== 4 ||
      item.options.some((option) => typeof option !== "string" || !option.trim()) ||
      new Set(item.options.map((option) => option.trim().toLowerCase())).size !== 4 ||
      !Number.isInteger(item.correctIndex) || item.correctIndex < 0 || item.correctIndex > 3) {
      throw new Error(`Invalid generated question ${index + 1}`);
    }
    return {
      id: `${prefix}-${index + 1}`,
      kind: "MCQ",
      status: "DRAFT",
      prompt: item.prompt.trim(),
      difficulty: item.difficulty,
      options: item.options.map((text, optionIndex) => ({ id: "abcd"[optionIndex], text: text.trim() })),
      correctOptionId: "abcd"[item.correctIndex],
    };
  });
}

async function run(slug) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug ?? "")) throw new Error("A taxonomy slug is required");
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is required");
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");
  const { GeminiFlashLLMAdapter } = require("@eqourse/adapters");
  const { SkillTaxonomyModel } = require("../../../dist/database/skill-taxonomy.schema.js");
  const { TestModel } = require("../../../dist/assessments/test.schema.js");
  await connect(process.env.MONGODB_URI);
  try {
    const taxonomy = await SkillTaxonomyModel.findOne({ slug, status: "ACTIVE" }).lean();
    if (!taxonomy) throw new Error("Active taxonomy slug not found");
    const test = await TestModel.findOne({ taxonomySlug: slug });
    if (!test) throw new Error("Configure the category test before generating drafts");
    const needed = Math.max(0, 15 - test.questions.length);
    if (needed === 0) { process.stdout.write(`${slug}: bank already contains at least 15 questions\n`); return; }
    const adapter = new GeminiFlashLLMAdapter(process.env.GEMINI_API_KEY, process.env.GEMINI_FLASH_MODEL || "gemini-3.8-flash");
    const prompt = [
      `Draft ${needed} independent, unambiguous multiple-choice skill-assessment questions for a global workforce platform.`,
      `Business unit: ${taxonomy.businessUnit}. Service line: ${taxonomy.serviceLine}. Skill: ${taxonomy.skill}. Specialization: ${taxonomy.specialization ?? "general"}.`,
      "Assess practical judgment a real client would value. Use internationally understandable contexts, no country-specific exams, no legal claims, no trick wording.",
      "Each item has exactly four plausible, distinct options and exactly one defensible correct answer. Balance easy, medium, and hard difficulty and vary the correct index.",
      "These are draft candidates for human review; do not claim they are validated or approved.",
    ].join("\n");
    const result = await adapter.generate({ prompt, schema: OUTPUT_SCHEMA });
    const questions = normalizeQuestions(result, `${slug}-${Date.now()}`);
    if (questions.length !== needed) throw new Error(`Expected ${needed} questions, got ${questions.length}`);
    test.questions.push(...questions);
    await test.save();
    process.stdout.write(`${slug}: stored ${questions.length} DRAFT questions for human review\n`);
  } finally { await disconnect(); }
}

if (require.main === module) run(process.argv[2]).catch((error) => {
  process.stderr.write(`Draft generation failed: ${error.message}\n`);
  process.exitCode = 1;
});

module.exports = { normalizeQuestions, run };
