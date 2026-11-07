import { ArrowUpRightIcon, CubeTransparentIcon } from "@heroicons/react/24/outline";

const resources = [
  { name: "Next.js", description: "App Router 与全栈开发", href: "https://nextjs.org/docs" },
  { name: "TypeScript", description: "类型安全的开发体验", href: "https://www.typescriptlang.org/docs/" },
  { name: "Tailwind CSS", description: "实用优先的样式工具", href: "https://tailwindcss.com/docs" },
  { name: "Heroicons", description: "简洁的 React SVG 图标", href: "https://heroicons.com" },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-20 sm:px-12">
      <CubeTransparentIcon aria-hidden="true" className="mb-8 size-14 text-indigo-600 dark:text-indigo-400" />
      <p className="mb-3 text-sm font-medium tracking-widest text-indigo-600 dark:text-indigo-400">AGILE3D</p>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">从这里开始构建。</h1>
      <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
        项目已就绪。编辑 <code className="rounded bg-zinc-100 px-2 py-1 text-sm dark:bg-zinc-900">src/app/page.tsx</code>，开始实现你的想法。
      </p>
      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {resources.map(({ name, description, href }) => (
          <a key={name} href={href} target="_blank" rel="noopener noreferrer" className="group rounded-2xl border border-zinc-200 p-6 transition-colors hover:border-indigo-500 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600 dark:border-zinc-800 dark:hover:bg-zinc-900">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">{name}</h2>
              <ArrowUpRightIcon aria-hidden="true" className="size-5 text-zinc-400 transition-colors group-hover:text-indigo-600" />
            </div>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
          </a>
        ))}
      </div>
    </main>
  );
}
