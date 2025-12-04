# TeslaMate Dashboard

1. 安装依赖

```bash
npm install
```

2. 配置环境变量（在项目根目录创建 `.env.local`），或直接在根目录放置 `token`/`token.txt`：

```env
NEXT_PUBLIC_GRAFANA_URL=https://your-grafana.example.com
NEXT_PUBLIC_GRAFANA_TOKEN=your_grafana_token
NEXT_PUBLIC_DATASOURCE_UID=your_datasource_uid
```

- 切勿在仓库或 PR 中提交真实的 Token、数据源 UID 或私有 API 地址。
- 若你不想把 Token 写在环境变量里，可以在仓库根目录新建 `token`（或 `token.txt`）文件，写入 Grafana Token，API 代理会自动读取并带上 Authorization 头，前端就能拿到真实数据。

3. 启动开发服务器

```bash
npm run dev
```

然后打开 http://localhost:3000

4. 部署到 Vercel

- 在 Vercel 控制台新建项目并导入本仓库。
- 在 “Environment Variables” 中添加：
  - `NEXT_PUBLIC_GRAFANA_URL` → 你的 Grafana 访问地址（如 `https://your-grafana.example.com`）。
  - `NEXT_PUBLIC_GRAFANA_TOKEN` → Grafana 服务账号的 Bearer Token。
  - `NEXT_PUBLIC_DATASOURCE_UID` → TeslaMate 数据源的 UID。
- 保存后点击 “Deploy”，Vercel 会自动执行 `npm install` 和 `npm run build` 并产出在线地址。
- 若需要更新环境变量，重新触发一次 “Redeploy” 即可在 API 代理中生效。
