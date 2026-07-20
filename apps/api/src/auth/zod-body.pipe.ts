import { BadRequestException, type PipeTransform } from "@nestjs/common";

interface ValidationIssue {
  path: PropertyKey[];
  message: string;
}

interface SafeParseSchema<T> {
  safeParse(value: unknown):
    | { success: true; data: T }
    | { success: false; error: { issues: ValidationIssue[] } };
}

export class ZodBodyPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: SafeParseSchema<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (result.success) return result.data;
    throw new BadRequestException({
      message: "Invalid request body",
      errors: result.error.issues.map((issue) => ({
        path: issue.path.map(String).join("."),
        message: issue.message,
      })),
    });
  }
}
