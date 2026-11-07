# Agile3D

基于 Next.js App Router、TypeScript、Tailwind CSS 和 Heroicons 的项目。

## 本地开发

需要 Node.js 20.9 或更新版本及 npm。

```bash
npm ci
npm run dev
```

打开 http://localhost:3000。首页位于 `src/app/page.tsx`，全局样式位于 `src/app/globals.css`。

## 检查与构建

```bash
npm run lint
npm run typecheck
npm run build
npm start
```

`npm start` 用于启动已完成构建的生产服务。

## Heroicons

```tsx
import { CubeTransparentIcon } from "@heroicons/react/24/outline";

<CubeTransparentIcon className="size-6" aria-hidden="true" />
```
