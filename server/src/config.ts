import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  databaseUrl: process.env.DATABASE_URL || "postgresql://localhost:5432/seqle",
  jwtSecret: process.env.JWT_SECRET || "dev-secret",
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigin: process.env.CORS_ORIGIN || undefined,
};
