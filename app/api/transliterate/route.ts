import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const text = request.nextUrl.searchParams.get("text") || "";
  if (!text.trim()) {
    return Response.json(["FAILED", []]);
  }

  try {
    const url = `https://inputtools.google.com/request?itc=ta-t-i0-und&num=5&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage&text=${encodeURIComponent(text)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const data = await res.json();
    return Response.json(data);
  } catch {
    return Response.json(["FAILED", []]);
  }
}
