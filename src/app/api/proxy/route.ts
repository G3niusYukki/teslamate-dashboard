import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

interface ProxyBody {
  sql: string;
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
    const { sql } = body;

    // 写死的默认配置（可以根据需要直接改成你自己的）
    const grafanaUrl =
      process.env.NEXT_PUBLIC_GRAFANA_URL || "http://localhost:3001";
    const token = resolveToken();
    // 使用你给出的 UID，确保能找到正确的数据源
    const datasourceUid =
      process.env.NEXT_PUBLIC_DATASOURCE_UID || "YOUR_DATASOURCE_UID";

    if (!grafanaUrl) {
      return NextResponse.json(
        { error: "Missing Grafana URL, please set grafanaUrl in proxy route" },
        { status: 500 },
      );
    }

    if (!token) {
      return NextResponse.json(
        {
          error:
            "Missing Grafana token. Please set NEXT_PUBLIC_GRAFANA_TOKEN or place it in a token/token.txt file.",
        },
        { status: 500 },
      );
    }

    const upstreamUrl = `${grafanaUrl}/api/ds/query`;

    const payload = {
      queries: [
        {
          refId: "A",
          datasource: { type: "postgres", uid: datasourceUid },
          rawSql: sql,
          rawQuery: true,      // ⭐️ 必须加
          format: "table"
        }
      ],
      from: "now-6h",
      to: "now"
    };    

    console.log(`[Proxy] Forwarding SQL to: ${upstreamUrl}`);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json",
    };

    // 只有设置了 token 才带 Authorization 头，方便无鉴权 Grafana 使用
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
        { error: `Upstream Grafana Error: ${upstreamResp.status}`, details: text },
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
