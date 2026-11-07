# Agile3D

从 `washitsu-threejs` 草稿迁移的通用 Three.js JSON 模型编辑器，使用 Next.js App Router、严格模式 TypeScript、Tailwind CSS 与 Heroicons。

## 开发与验证

需要 Node.js 20.9+ 和 npm。

```bash
npm ci
npm run dev
```

访问 http://localhost:3000。

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

ESLint 对 `src`、`scripts`、`test` 中的 TypeScript 文件强制执行每文件最多 500 行。JSON 项目数据、图片和自动生成的锁文件不受源码行数限制。

## 使用方式

启动时没有活动项目。通过 File → New project 创建空项目，或 File → Open JSON 打开 `data/room.json`、`data/sandboxlayer.json` 等示例。

- File：新建、打开、保存、下载 JSON，以及回退到上次保存状态。
- Edit：创建基础几何体和可复用组件、复制粘贴、删除、移动、旋转和缩放。
- View：透视与正交投影切换，正视、侧视、俯视、适配模型及坐标轴开关。
- Window：独立显示层级面板和属性面板。
- Settings：编辑模式和夜间环境。

双击模型选择对象，拖动层级项目可调整所属分组并保留世界位置。属性面板支持尺寸、位置、旋转、颜色、发光和透明度。右下角方向导航跟随相机旋转，点击 X/Y/Z 切换观察方向。

快捷键：Cmd/Ctrl+S 保存，+D 下载副本，+C/+V 复制粘贴，+Z 回退至上次保存状态，Esc 取消选择。这里的 +Z 是保存检查点回退。

支持 File System Access API 的浏览器可以直接保存至文件；其他浏览器使用 Download JSON 导出副本。更换或离开有未保存修改的项目时会提示。

## 代码结构

| 位置 | 职责 |
| --- | --- |
| `src/app` | 页面生命周期、布局和样式入口 |
| `src/components` | 菜单、属性/层级面板、方向导航的 React 视图 |
| `src/main.ts` | Three.js 渲染、环境、相机和编辑器装配 |
| `src/editor/sceneTypes.ts` | 与渲染及 DOM 无关的项目数据类型和单位常量 |
| `src/editor/sceneValidation.ts` | JSON 校验和 v2 → v3 格式转换 |
| `src/editor/sceneMaterials.ts` | 材质及程序纹理 |
| `src/editor/SceneDocument.ts` | JSON 与场景对象转换、尺寸修改 |
| `src/editor/ProjectDataStore.ts` | 项目生命周期、保存检查点、文件操作 |
| `src/editor/ObjectEditor.ts` | 选择、变换和编辑器事件协调 |
| `src/editor/HierarchyController.ts` | 层级显示、折叠、可见性和拖动重分组 |
| `src/editor/PropertyController.ts` | 属性输入展示、单位转换和属性修改 |
| `src/editor/AddObjectMenu.ts` | 基础几何体和组件库菜单 |
| `src/objects` | 几何体工厂、组件注册和按领域分类的组件 |
| `test` | 相机、坐标轴、方向导航、文档校验和几何转换回归测试 |

控制器通过类型明确的回调访问当前选择和执行操作，几何体只依赖领域类型。新增几何体在 `elements` 中实现，组合组件在 `components` 中实现并注册到 `registry.ts`。

## JSON 格式与资源

当前格式版本为 3，`unit` 和 `positionUnit` 均为 `0.02`：每毫米对应 0.02 个场景单位。位置、尺寸、路径使用整数毫米，旋转使用角度，缩放使用三轴倍数。打开 v2 项目时自动转换，不修改原始输入。

`objects` 保存模型实例，`modules` 保存可复用模板。重复 ID、非法尺寸、材质或不支持的几何体类型会被拒绝。草稿中的全部 JSON 示例及历史数据保存在 `data/`，全部参考图片保存在 `public/reference/`。

坐标轴、变换控件与方向导航共用 `src/app/theme.css` 中的 `--axis-x/y/z/active` 颜色配置。

## 数据处理脚本

以下脚本会修改传入的项目文件；省略参数时使用 `data/room.json`，执行前请自行保存副本。

```bash
node --import tsx scripts/migrate-project-to-mm-v3.ts /path/to/project.json
node --import tsx scripts/install-sandboxes.ts /path/to/project.json
node --import tsx scripts/refine-pipes-and-gravel.ts /path/to/project.json
```

脚本复用领域校验，并在写入前验证输出。迁移脚本同时接受现有 v3 文件。
