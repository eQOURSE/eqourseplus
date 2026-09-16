import { existsSync } from "node:fs";
import path from "node:path";

interface LocalEnvironmentOptions {
  cwd?: string;
  environment?: NodeJS.ProcessEnv;
  fileExists?: (candidate: string) => boolean;
  loadEnvFile?: (candidate: string) => void;
}

export function loadLocalEnvironment(
  options: LocalEnvironmentOptions = {},
): string | undefined {
  const environment = options.environment ?? process.env;
  if (environment.NODE_ENV === "production") return undefined;

  const cwd = options.cwd ?? process.cwd();
  const fileExists = options.fileExists ?? existsSync;
  const candidates = [
    path.resolve(cwd, ".env"),
    path.resolve(cwd, "..", "..", ".env"),
  ];
  const envFile = candidates.find(fileExists);
  if (!envFile) return undefined;

  const loadEnvFile = options.loadEnvFile
    ?? ((candidate: string) => process.loadEnvFile(candidate));
  loadEnvFile(envFile);
  return envFile;
}
