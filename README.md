# TeslaMate Dashboard

1. 安装依赖

```bash
npm install
```

2. 配置环境变量（在项目根目录创建 `.env.local`）：

```env
NEXT_PUBLIC_GRAFANA_URL=http://108.175.9.151:3001
NEXT_PUBLIC_GRAFANA_TOKEN=glsa_tyZtyCl9VKE9rAvVMZ9lHiKXI3JwFRza_63be5afb
NEXT_PUBLIC_DATASOURCE_UID=TeslaMate
```

3. 启动开发服务器

```bash
npm run dev
```

然后打开 http://localhost:3000
