import type { LLMAdapter } from "./contracts/llm.adapter";

export interface StructuredGenerationRequest {
  prompt: string;
  schema: Record<string, unknown>;
}

export class GeminiFlashLLMAdapter implements LLMAdapter<StructuredGenerationRequest, unknown> {
  constructor(private readonly apiKey: string, private readonly model = "gemini-3.8-flash") {
    if (!apiKey) throw new Error("GEMINI_API_KEY is required");
    if (!/^gemini-[a-z0-9.-]*flash[a-z0-9.-]*$/.test(model)) throw new Error("A Gemini Flash model is required");
  }

  async generate(request: StructuredGenerationRequest): Promise<unknown> {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": this.apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: request.prompt }] }],
        generationConfig: { responseMimeType: "application/json", responseJsonSchema: request.schema },
      }),
      signal: AbortSignal.timeout(90_000),
    });
    if (!response.ok) throw new Error(`Gemini generation failed (${response.status})`);
    const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("");
    if (!text) throw new Error("Gemini returned no structured text");
    try { return JSON.parse(text) as unknown; }
    catch { throw new Error("Gemini returned invalid structured JSON"); }
  }
}
