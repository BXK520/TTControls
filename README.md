<p align="center">
  <img src="https://img.shields.io/badge/ver-0.0.1-blueviolet?style=for-the-badge" alt="version" />
  <img src="https://img.shields.io/badge/three.js-≥0.170-blue?style=for-the-badge&logo=threedotjs" alt="three.js" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" alt="license" />
  <img src="https://img.shields.io/badge/type-typescript-3178C6?style=for-the-badge&logo=typescript" alt="typescript" />
</p>

```
  ╔══════════════════════════════════════════════════════════╗
  ║   ✦   TTControls  ·  下一代 Three.js 变换操控器  ✦     ║
  ║   ✦  TTControls  ·  A Next-Gen Transform Gizmo   ✦     ║
  ║     掌控你的物体，每次一个轴。                              ║
  ║     Take Control of Your Objects, One Axis at a Time.   ║
  ╚══════════════════════════════════════════════════════════╝
```

---

## 📜 概述
## 📜 Introduction

**TTControls** 是一个为 **Three.js** 打造的**下一代变换控制器**。
**TTControls** is a **next-generation transform controller** built for **Three.js**.

灵感源于 Three.js 官方 `TransformControls`，我们在其上做了全方位增强。
Inspired by the official Three.js `TransformControls`, we've reimagined it with a full suite of enhancements.

它支持**平移**、**旋转**、**缩放**三种模式，以及独创的 **"All"（三合一）模式** —— 让三种手柄同时可见，如同全息控制面板。
It supports **Translate**, **Rotate**, **Scale** — plus a unique **"All" (3-in-1) mode** that renders all three gizmos simultaneously, like a holographic control panel.

纯 **TypeScript** 编写，类型完整、事件丰富，是 Three.js 项目理想的交互编辑组件。
Written in pure **TypeScript**, with complete type definitions and a rich event system — the ideal editing component for any Three.js project.

---

## ✨ 特性
## ✨ Features

<table>
  <tr>
    <td>🎮</td>
    <td><b>四模式切换</b></td>
    <td><b>Four Modes</b></td>
    <td>translate / rotate / scale / <b>all</b>（三合一 / 3-in-1）</td>
  </tr>
  <tr>
    <td>🌍</td>
    <td><b>双空间支持</b></td>
    <td><b>Dual Space</b></td>
    <td>world（世界坐标） / local（本地坐标）</td>
  </tr>
  <tr>
    <td>📏</td>
    <td><b>吸附功能</b></td>
    <td><b>Snap Controls</b></td>
    <td>平移吸附 / 旋转吸附 / 缩放吸附，精度自由设定</td>
  </tr>
  <tr>
    <td>🎯</td>
    <td><b>轴约束</b></td>
    <td><b>Axis Constraints</b></td>
    <td>独立开关 X / Y / Z 轴显示与操作</td>
  </tr>
  <tr>
    <td>🚧</td>
    <td><b>范围限制</b></td>
    <td><b>Range Limits</b></td>
    <td>minX / maxX 等六个方向锁定物体位置边界</td>
  </tr>
  <tr>
    <td>🎨</td>
    <td><b>自定义配色</b></td>
    <td><b>Custom Colors</b></td>
    <td>X/Y/Z 轴颜色 + 激活高亮色，四通道独立配置</td>
  </tr>
  <tr>
    <td>📷</td>
    <td><b>正交相机兼容</b></td>
    <td><b>Ortho Camera</b></td>
    <td>自动检测透视/正交相机，自适应尺寸缩放</td>
  </tr>
  <tr>
    <td>📡</td>
    <td><b>20+ 事件系统</b></td>
    <td><b>20+ Events</b></td>
    <td>超细粒度状态变更通知</td>
  </tr>
  <tr>
    <td>🧩</td>
    <td><b>Helper 导出</b></td>
    <td><b>Helper Export</b></td>
    <td>getHelper() 获取完整场景子树，可嵌入自定义场景图</td>
  </tr>
  <tr>
    <td>💾</td>
    <td><b>轻量纯净</b></td>
    <td><b>Lightweight</b></td>
    <td>除 Three.js 外零运行时依赖</td>
  </tr>
</table>

---

## 📦 安装
## 📦 Installation

```bash
# npm
npm install ttcontrols

# pnpm（推荐 / recommended）
pnpm add ttcontrols

# yarn
yarn add ttcontrols
```

### 同伴依赖
### Peer Dependencies

| 依赖 / Dependency | 版本 / Version |
|-------------------|----------------|
| `three` | ≥ 0.170.0 |
| `lit` | ≥ 3.0.0 |

> ⚠️ 请确保你的项目中已安装 `three` 和 `lit`。
> ⚠️ Make sure `three` and `lit` are already installed in your project.

---

## 🚀 快速开始
## 🚀 Quick Start

### 最简示例
### Minimal Example

```typescript
import * as THREE from 'three'
import { TTControls } from 'ttcontrols'

// 1. 搭建场景
// 1. Set up scene
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
const renderer = new THREE.WebGLRenderer()
document.body.appendChild(renderer.domElement)

// 2. 创建被操控的物体
// 2. Create an object to control
const geometry = new THREE.BoxGeometry(1, 1, 1)
const material = new THREE.MeshStandardMaterial({ color: 0xff6b9d })
const cube = new THREE.Mesh(geometry, material)
scene.add(cube)

// 3. 实例化 TTControls
// 3. Instantiate TTControls
const controls = new TTControls(camera, renderer.domElement)

// 4. 绑定物体
// 4. Attach the object
controls.attach(cube)

// 5. 将手柄添加到场景
// 5. Add the gizmo helper to the scene
scene.add(controls.getHelper())

// 6. 渲染循环
// 6. Render loop
function animate() {
  requestAnimationFrame(animate)
  renderer.render(scene, camera)
}
animate()
```

> 🎉 完成了！现在你的小方块可以自由拖拽、旋转、缩放了！
> 🎉 Done! Your cube can now be freely moved, rotated, and scaled!

---

## 📖 API 参考
## 📖 API Reference

### 构造函数
### Constructor

```typescript
new TTControls(camera: Camera, domElement?: HTMLElement | SVGElement)
```

| 参数 / Parameter | 类型 / Type | 说明 / Description |
|------|------|------|
| `camera` | `THREE.Camera` | 场景相机（透视/正交均可） |
| | | Scene camera (perspective or orthographic) |
| `domElement` | `HTMLElement \| SVGElement` | 监听指针事件的 DOM 容器（可选，可后续 connect） |
| | | DOM element to listen for pointer events (optional, can be connected later) |

---

### 模式与空间
### Modes & Space

```typescript
// 设置变换模式
// Set transform mode
controls.mode = 'translate'   // 平移 / Translate
controls.mode = 'rotate'      // 旋转 / Rotate
controls.mode = 'scale'       // 缩放 / Scale
controls.mode = 'all'         // ✨ 三合一模式 / 3-in-1 mode

// 设置坐标空间
// Set coordinate space
controls.space = 'world'      // 世界空间 / World space
controls.space = 'local'      // 本地空间 / Local space

// 读取当前值
// Read current values
console.log(controls.mode)    // 'translate'
console.log(controls.space)   // 'world'
```

```
  三合一模式 (all) 布局：
  All (3-in-1) Mode Layout:
  ┌──────────────────────────────────────┐
  │  🟥 平移箭头 —— 最长、最外层              │
  │  🟥 Translate arrows: longest, outermost │
  │  🟩 旋转环   —— 居中                      │
  │  🟩 Rotate rings:   middle               │
  │  🟦 缩放方块 —— 最短、最内层              │
  │  🟦 Scale handles:  shortest, innermost   │
  │  三种手柄同时可见，互不遮挡 ✨            │
  │  All three gizmos visible, no occlusion. │
  └──────────────────────────────────────┘
```

---

### 吸附
### Snap

```typescript
// 平移吸附 —— 锁定到指定步长
// Translate snap — lock movement to a step size
controls.translationSnap = 0.5   // 以 0.5 为单位移动
controls.translationSnap = null  // 关闭吸附 / disable snap

// 旋转吸附 —— 角度步长（弧度）
// Rotate snap — angle step (in radians)
controls.rotationSnap = Math.PI / 12  // 每次旋转 15° / snap to 15° increments

// 缩放吸附
// Scale snap
controls.scaleSnap = 0.1   // 以 0.1 为单位缩放 / snap to 0.1 increments
```

---

### 轴控制
### Axis Control

```typescript
// 显示 / 隐藏特定轴
// Show / hide specific axis handles
controls.showX = false   // 隐藏 X 轴 / hide X axis
controls.showY = true
controls.showZ = true

// 当前激活的轴（只读，悬停或拖拽时自动更新）
// Active axis (read-only, updated on hover/drag)
console.log(controls.axis)   // 'X' | 'Y' | 'Z' | 'XY' | 'XZ' | 'XYZ' | 'XYZE' | null
```

---

### 范围限制
### Range Limits

```typescript
// 锁定位移边界
// Lock position boundaries
controls.minX = -10
controls.maxX = 10
controls.minY = 0          // 物体不能低于 Y=0 / object can't go below Y=0
controls.maxY = Infinity
controls.minZ = -5
controls.maxZ = 5
```

---

### 自定义颜色
### Custom Colors

```typescript
controls.setColors(
  0xEB4659,   // X 轴颜色（红）/ X axis (red)
  0x86CD35,   // Y 轴颜色（绿）/ Y axis (green)
  0x3E8AEF,   // Z 轴颜色（蓝）/ Z axis (blue)
  0xFFDD00    // 选中高亮色（黄）/ active highlight (yellow)
)
```

---

### 生命周期
### Lifecycle

```typescript
// 绑定物体，返回 this，支持链式调用
// Attach an object, returns this, supports chaining
controls.attach(myMesh)

// 解绑物体
// Detach the object
controls.detach()

// 重置当前拖拽（回到拖拽前状态）
// Reset current drag (back to pre-drag state)
controls.reset()

// 销毁控件（释放所有资源）
// Dispose — release all resources
controls.dispose()
```

```typescript
// DOM 连接管理（适用于动态添加/移除 canvas）
// DOM connection management (for dynamically adding/removing canvas)
controls.connect(domElement)
controls.disconnect()
```

---

### Helper 导出
### Helper Export

```typescript
// 获取控件场景子树，需手动添加到场景中
// Get the control's scene subtree (add to scene manually)
const helper = controls.getHelper()
scene.add(helper)
```

---

## 📡 事件系统
## 📡 Events

TTControls 提供 **20+** 种细粒度事件，让你能精确感知每次状态变化。
TTControls exposes **20+** fine-grained event types, giving you full visibility into every state change.

| 事件名 / Event | 触发时机 / Trigger | Payload |
|--------|----------|---------|
| `change` | 任何状态变化 / Any state change | `{}` |
| `mouseDown` | 开始拖拽 / Drag starts | `{ mode }` |
| `mouseUp` | 结束拖拽 / Drag ends | `{ mode }` |
| `objectChange` | 物体变换改变 / Object transform changed | `{}` |
| `mode-changed` | 模式切换 / Mode switched | `{ value: TransformControlsMode }` |
| `space-changed` | 空间切换 / Space switched | `{ value: 'world' \| 'local' }` |
| `axis-changed` | 激活轴变化 / Active axis changed | `{ value: string \| null }` |
| `dragging-changed` | 拖拽状态变化 / Dragging state changed | `{ value: boolean }` |
| `translationSnap-changed` | 平移吸附变化 / Translation snap changed | `{ value: number \| null }` |
| `rotationSnap-changed` | 旋转吸附变化 / Rotation snap changed | `{ value: number \| null }` |
| `scaleSnap-changed` | 缩放吸附变化 / Scale snap changed | `{ value: number \| null }` |
| `size-changed` | 手柄尺寸变化 / Handle size changed | `{ value: number }` |
| `enabled-changed` | 启用/禁用 / Enabled/disabled | `{ value: boolean }` |
| `showX/Y/Z-changed` | 轴可见性变化 / Axis visibility changed | `{ value: boolean }` |
| `minX/maxX/...changed` | 范围限制变化 / Range limit changed | `{ value: number }` |
| `camera-changed` | 相机变化 / Camera changed | `{ value: Camera }` |
| `object-changed` | 绑定物体变化 / Attached object changed | `{ value: Object3D }` |
| `worldPosition-changed` | 世界位置变化 / World position changed | `{ value: Vector3 }` |
| `rotationAxis-changed` | 旋转轴变化 / Rotation axis changed | `{ value: Vector3 }` |
| `rotationAngle-changed` | 旋转角变化 / Rotation angle changed | `{ value: number }` |

```typescript
// 事件监听示例
// Event listening examples
controls.addEventListener('mode-changed', (e) => {
  console.log(`模式切换为: ${e.value}`)
  console.log(`Mode switched to: ${e.value}`)
})

controls.addEventListener('dragging-changed', (e) => {
  if (e.value) {
    console.log('🎯 开始拖拽！/ Dragging started!')
  } else {
    console.log('✨ 拖拽结束~/ Dragging ended!')
  }
})

controls.addEventListener('axis-changed', (e) => {
  console.log(`当前轴: ${e.value ?? '无'}`)
  console.log(`Active axis: ${e.value ?? 'none'}`)
})
```

---

## 🎮 配套组件：TransformInfoPanel
## 🎮 Companion: TransformInfoPanel

TTControls 有一个好搭档 —— **TransformInfoPanel**！
TTControls has a companion — **TransformInfoPanel**!

它是一个浮动信息面板，在拖拽手柄时显示实时变换数值。
A floating info panel that displays real-time transform values while you drag.

```
  ┌─────────────────────┐
  │  平移     LOCAL     │
  │  Translate  LOCAL   │
  │  Axis          X    │
  │  X   +1.2345        │
  │  Y   0.0000         │
  │  Z   -0.5678        │
  └─────────────────────┘
```

```typescript
import { TransformInfoPanel } from 'transform-info-panel'

// 语言：'zh' | 'en'   主题：'dark' | 'light' | 自定义
// locale: 'zh' | 'en'   theme: 'dark' | 'light' | custom
const panel = new TransformInfoPanel(controls, {
  locale: 'zh',
  theme: 'dark',
  offset: [50, -100]     // 面板相对光标的偏移 / panel offset from cursor
})
```

---

## 🏗️ 架构概览
## 🏗️ Architecture

```
TTControls（主控类，继承 THREE.Controls）
TTControls (main class, extends THREE.Controls)
  ├── TransformControlsRoot（场景根节点 / scene root node）
  │    ├── TransformControlsGizmo（视觉手柄层 / visual handles）
  │    │    ├── gizmo['translate']  ← 平移手柄 / Translate handles
  │    │    ├── gizmo['rotate']     ← 旋转手柄 / Rotate handles
  │    │    ├── gizmo['scale']      ← 缩放手柄 / Scale handles
  │    │    ├── gizmo['all']        ← 三合一手柄 / 3-in-1 handles
  │    │    ├── picker['translate'] ← 不可见拾取层 / Invisible pick layer
  │    │    ├── picker['rotate']
  │    │    ├── picker['scale']
  │    │    └── picker['all']
  │    └── TransformControlsPlane（无限大操作平面 / infinite operating plane）
  └── 20+ 属性定义器 / 20+ property definers (defineProperty)
```

### 层级说明
### Layer Breakdown

| 层 / Layer | 类 / Class | 职责 / Responsibility |
|----|-----|------|
| 🎛️ 主控层 | `TTControls` | 事件分发、生命周期管理、API 暴露 |
| Controller | | Event dispatch, lifecycle, API exposure |
| 🌳 场景层 | `TransformControlsRoot` | 每帧同步矩阵分解、相机参数 |
| Scene | | Per-frame matrix decomposition, camera updates |
| 🎨 视觉层 | `TransformControlsGizmo` | 构建手柄几何体、每帧更新可见性/缩放/高亮 |
| Visual | | Geometry construction, per-frame visibility/scale/highlight |
| 🎯 拾取层 | `picker`（内嵌于 Gizmo / embedded） | 不可见的大尺寸射线检测体 |
| Picker | | Invisible oversized raycasting targets |
| 📐 平面层 | `TransformControlsPlane` | 定义拖拽操作约束平面 |
| Plane | | Drag constraint plane |
| ⚙️ 逻辑层 | `pointerDown/Move/Up/Hover` | 平移/旋转/缩放的数学计算 |
| Logic | | Math for translate/rotate/scale |

---

## 🧪 开发
## 🧪 Development

```bash
# 克隆仓库
# Clone the repo
git clone <your-repo-url>
cd packages/TTControls

# 安装依赖
# Install dependencies
pnpm install

# 构建
# Build
pnpm build
```

### 技术栈
### Tech Stack

- **Three.js** — 3D 渲染与数学库 / 3D rendering & math
- **TypeScript** — 类型安全 / type safety
- **Vite** — 构建工具 / build tooling
- **Lit** — Web Components 支持（配套面板使用）/ Web Components support (used by companion panel)

---

## 📐 几何体尺寸参考
## 📐 Geometry Size Reference

| 组件 / Component | 视觉尺寸 / Visual Size | 拾取尺寸 / Pick Size |
|------|----------|----------|
| 平移箭头 | 半径 0.015, 高 0.065 | 半径 0.045, 高 0.065 |
| Translate Arrow | radius 0.015, height 0.065 | radius 0.045, height 0.065 |
| 平移轴线 | 半径 0.006, 长 0.35 | 半径 0.022, 长 0.35 |
| Translate Shaft | radius 0.006, length 0.35 | radius 0.022, length 0.35 |
| 旋转环 | 半径 0.20, 管径 0.006, 弧 1.2π | 半径 0.20, 管径 0.035 |
| Rotate Ring | radius 0.20, tube 0.006, arc 1.2π | radius 0.20, tube 0.035 |
| 缩放方块 | 0.05 × 0.05 × 0.05 | 0.10 × 0.10 × 0.10 |
| Scale Handle | 0.05 × 0.05 × 0.05 | 0.10 × 0.10 × 0.10 |
| 平面拾取 | — | 0.10 × 0.10 |
| Plane Pick | — | 0.10 × 0.10 |

> 💡 视觉几何体刻意做得比拾取体小，确保点击体验流畅，视觉上精致不累赘。
> 💡 Visual geometry is intentionally smaller than the pick geometry — smooth clicking, clean visuals.

---

## 🗺️ 路线图
## 🗺️ Roadmap

- [x] 平移 / 旋转 / 缩放三模式 / Translate, Rotate, Scale modes
- [x] All 三合一模式 / All 3-in-1 mode
- [x] World / Local 双空间 / World & Local dual space
- [x] 吸附系统 / Snap system
- [x] 范围限制（Min/Max）/ Range limits
- [x] 正交相机兼容 / Orthographic camera support
- [x] 20+ 细粒度事件 / 20+ fine-grained events
- [x] 自定义配色 / Custom colors
- [x] 配套 TransformInfoPanel / Companion TransformInfoPanel
- [ ] 撤销/重做历史栈 / Undo & redo history stack
- [ ] 多物体同时操控 / Multi-object selection
- [ ] 网格平面吸附 / Grid plane snapping
- [ ] 自定义手柄形状 / Custom handle shapes
- [ ] 触屏手势优化 / Touch gesture optimization

---

## 📄 许可证
## 📄 License

MIT © [benxiaokang](https://github.com/benxiaokang)

---

```
  ╔══════════════════════════════════════════════╗
  ║   好的工具，让你忘记它的存在。                 ║
  ║   A good tool makes you forget it's there.   ║
  ╚══════════════════════════════════════════════╝
```
