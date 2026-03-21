import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://backend:8000";

async function proxyRequest(request: NextRequest) {
  const url = new URL(request.url);
  const backendUrl = `${BACKEND_URL}${url.pathname}${url.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (key !== "host" && key !== "connection") {
      headers.set(key, value);
    }
  });

  const init: RequestInit = {
    method: request.method,
    headers,
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  try {
    const response = await fetch(backendUrl, init);

    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      if (key !== "transfer-encoding") {
        responseHeaders.set(key, value);
      }
    });

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error(`[API Proxy] Error proxying ${request.method} ${url.pathname}:`, error);
    return NextResponse.json(
      { detail: "백엔드 서비스에 연결할 수 없습니다." },
      { status: 502 }
    );
  }
}

export async function GET(request: NextRequest) {
  return proxyRequest(request);
}

export async function POST(request: NextRequest) {
  return proxyRequest(request);
}

export async function PUT(request: NextRequest) {
  return proxyRequest(request);
}

export async function DELETE(request: NextRequest) {
  return proxyRequest(request);
}
