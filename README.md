# LLM Sand Game Test

[English](README.en.md)

同一句提示词，不同模型做落沙游戏。这里放测试代码和视频。

这个小题同时压着需求理解、物理模拟、材质系统、前端工程、交互设计、性能、自测和约束遵循。模型生成出来的结果，会很快暴露它们各自擅长什么、忽略什么，以及在真实开发中可能会把问题带到哪里。

## 提示词

```text
完成一个基于用物理引擎和 HTML/CSS 的带材质系统的落沙模拟游戏
```

单 HTML 版本：

```text
完成一个基于用物理引擎和 HTML/CSS 的带材质系统的落沙模拟游戏（单HTML）
```

## 视频

| 视频 | 说明 |
| --- | --- |
| [![compare](media/thumbnails/compare.jpg)](media/compare.mp4) | 测试合集，带进度条和模型标注。原片超过 GitHub 单文件限制，这里放压缩版。 |
| [![gpt55](media/thumbnails/gpt55.jpg)](media/gpt55.mp4) | GPT-5.5 单独测试。 |
| [![gemini35-flash](media/thumbnails/gemini35-flash.jpg)](media/gemini35-flash.mp4) | Gemini 3.5 Flash 补测。 |

## 测试结果

代码在 [`results/`](results/)。

目前包含 Codex/GPT、Claude Code、Antigravity/Gemini、Qwen、GLM、MiniMax、DeepSeek 等结果。目录基本保留原样，只删掉了 `node_modules`、`.DS_Store` 和本机工具配置。

多数结果直接打开入口 HTML 就能看。也可以起一个静态服务：

```bash
python3 -m http.server 4173
```

然后打开：

```text
http://localhost:4173/results/
```

## 说明

这不是排行榜，只是同一句 prompt 下的现场记录。新模型可以继续往里加。

## License

MIT
