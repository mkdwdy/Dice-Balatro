import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Zod 검증 에러 처리
  if (err instanceof z.ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      details: err.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    });
  }

  // 커스텀 AppError 처리
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
  }

  // 예상치 못한 에러 처리
  console.error("Unhandled error:", err);
  
  // 프로덕션 환경에서는 상세 에러 정보 숨김
  const isDevelopment = process.env.NODE_ENV === "development";
  
  res.status(500).json({
    error: "Internal server error",
    ...(isDevelopment && err instanceof Error && {
      message: err.message,
      stack: err.stack,
    }),
  });
}

