export interface DatabaseConfig {
  uri: string;
  autoIndex: boolean;
}
export function loadDatabaseConfig(
  environment: NodeJS.ProcessEnv,
): DatabaseConfig {
  const uri = environment.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is required for database connection");
  }
  return { uri, autoIndex: environment.NODE_ENV !== "production" };
}
