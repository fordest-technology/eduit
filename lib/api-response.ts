import { NextResponse } from "next/server";

interface ApiResponseOptions {
  status?: number;
  headers?: Record<string, string>;
}

export function apiResponse<T>(data: T, options: ApiResponseOptions = {}) {
  const { status = 200, headers = {} } = options;

  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
    {
      status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0",
        ...headers,
      },
    }
  );
}

export function apiError(message: string, status: number = 400, errors?: any) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      errors,
      timestamp: new Date().toISOString(),
    },
    {
      status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
