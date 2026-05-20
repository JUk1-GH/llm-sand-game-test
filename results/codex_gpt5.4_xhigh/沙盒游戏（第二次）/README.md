# Dustfall Forge

一个纯前端落沙模拟游戏，使用 `HTML + CSS + Canvas + 原生 JavaScript` 构建，并带有数据驱动的材质系统。

## 特性

- 自写网格物理引擎，支持粉末、液体、气体和热源行为
- 10 种可交互材质：沙子、水、石头、木头、火焰、蒸汽、燃油、酸液、熔岩、玻璃
- 材质规则包含密度、燃烧、腐蚀、相变和冷却
- 支持画笔大小、喷洒密度、模拟速度调节
- 内置演示场景，方便快速观察材质联动

## 运行

最直接的方式：

- 直接双击 `index.html`
- 或在终端执行 `open /Volumes/SSD/gpttocodex/index.html`

如果你更想走本地静态服务，也可以在自己的终端里执行：

```bash
cd /Volumes/SSD/gpttocodex
python3 -m http.server 4173
```

然后访问 `http://localhost:4173`

## 操作

- 左键：绘制当前材质
- 右键：擦除
- `Space`：暂停 / 继续
- `R`：恢复演示场景
- `C`：清空画布

## 文件

- `index.html`：页面结构
- `styles.css`：界面与响应式样式
- `main.js`：材质系统、物理引擎、渲染与交互
