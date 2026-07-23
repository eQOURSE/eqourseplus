import type { LoggerService, LogLevel } from "@nestjs/common";

import { currentRequestId } from "./request-context";
import { redactSensitive } from "./redaction";

type LogSink = (line: string) => void;

export class JsonLogger implements LoggerService {
  constructor(
    private readonly sink: LogSink = (line) => {
      process.stdout.write(`${line}\n`);
    },
  ) {}

  log(message: unknown, ...optionalParams: unknown[]): void {
    this.write("log", message, optionalParams);
  }

  fatal(message: unknown, ...optionalParams: unknown[]): void {
    this.write("fatal", message, optionalParams);
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    this.write("error", message, optionalParams);
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    this.write("warn", message, optionalParams);
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    this.write("debug", message, optionalParams);
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    this.write("verbose", message, optionalParams);
  }

  private write(
    level: LogLevel,
    message: unknown,
    optionalParams: unknown[],
  ): void {
    const params = [...optionalParams];
    const possibleContext = params.at(-1);
    const context =
      typeof possibleContext === "string" ? String(params.pop()) : undefined;
    const record = {
      timestamp: new Date().toISOString(),
      level,
      context: context ? redactSensitive(context) : undefined,
      message: redactSensitive(message),
      details: params.length > 0 ? redactSensitive(params) : undefined,
      requestId: currentRequestId(),
    };

    this.sink(JSON.stringify(record));
  }
}
