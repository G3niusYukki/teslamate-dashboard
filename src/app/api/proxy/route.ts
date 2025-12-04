import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

interface ProxyBody {
  sql: string;
  config?: {
    grafanaUrl?: string;
    token?: string;
    datasourceUid?: string;
  }
}

function readTokenFromFile(): string {
  const candidates = ["token", "token.txt", "token.env"];
  for (const filename of candidates) {
    const fullPath = path.join(process.cwd(), filename);
    if (fs.existsSync(fullPath)) {
      try {
        const fileToken = fs.readFileSync(fullPath, "utf8").trim();
        if (fileToken) return fileToken;
      } catch (err) {
        console.warn(`[Proxy] Failed to read token file ${filename}:`, err);
      }
    }
  }
  return "";
}

function resolveToken(): string {
  if (process.env.NEXT_PUBLIC_GRAFANA_TOKEN) {
    return process.env.NEXT_PUBLIC_GRAFANA_TOKEN;
  }
  const fileToken = readTokenFromFile();
  if (fileToken) return fileToken;
  return "";
}

export async function POST(request: Request) {
  try {
    const body: ProxyBody = await request.json();
    const { sql, config } = body;

    // 优先使用前端传入的配置，如果没有则回退到环境变量
    const grafanaUrl = 
      config?.grafanaUrl || process.env.NEXT_PUBLIC_GRAFANA_URL || "http://localhost:3001";
    
    // Token 处理：前端传入 -> 环境变量 -> 文件
    let token = config?.token;
    if (!token) {
        token = resolveToken();
    }

    const datasourceUid = 
      config?.datasourceUid || process.env.NEXT_PUBLIC_DATASOURCE_UID || "YOUR_DATASOURCE_UID";

    if (!grafanaUrl) {
      return NextResponse.json(
        { error: "Missing Grafana URL. Please set it in Settings or Env Vars." },
        { status: 500 },
      );
    }

    if (!token) {
      return NextResponse.json(
        {
          error: "Missing Grafana Token. Please set it in Settings or Env Vars.",
        },
        { status: 500 },
      );
    }

    // 移除末尾可能的斜杠，避免双斜杠问题
    const cleanUrl = grafanaUrl.replace(/\/+$/, "");
    const upstreamUrl = `${cleanUrl}/api/ds/query`;

    const payload = {
      queries: [
        {
          refId: "A",
          datasource: { type: "postgres", uid: datasourceUid },
          rawSql: sql,
          rawQuery: true,
          format: "table"
        }
      ],
      from: "now-6h",
      to: "now"
    };    

    // console.log(`[Proxy] Forwarding SQL to: ${upstreamUrl}`);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const upstreamResp = await fetch(upstreamUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!upstreamResp.ok) {
      const text = await upstreamResp.text();
      console.error("[Proxy] Upstream Error:", upstreamResp.status, text);
      return NextResponse.json(
        { error: `Grafana Error (${upstreamResp.status})`, details: text },
        { status: upstreamResp.status },
      );
    }

    const data = await upstreamResp.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[Proxy] Internal Error:", err);
    return NextResponse.json(
      { error: "Internal Proxy Error", details: err?.message },
      { status: 500 },
    );
  }
}
