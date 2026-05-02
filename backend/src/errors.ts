import type { NextFunction, Request, Response } from "express";

export class AppError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (error instanceof AppError) {
    return res.status(error.status).json({ error: error.message });
  }

  if (error && typeof error === "object" && "code" in error && error.code === "23505") {
    return res.status(409).json({ error: "That record already exists." });
  }

  console.error(error);
  return res.status(500).json({ error: "Internal server error" });
}
