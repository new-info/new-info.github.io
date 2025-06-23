# PWA 图标目录

这个目录包含用于 PWA（Progressive Web App）的各种尺寸图标。

## 所需图标尺寸

- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## 生成图标

你可以使用在线工具来生成这些图标：

1. **在线生成器**：
   - https://realfavicongenerator.net/
   - https://www.favicon-generator.org/

2. **从SVG生成**：
   创建一个简单的 SVG 图标，然后使用工具转换为各种尺寸的 PNG。

3. **使用图标字体**：
   可以使用 📚 这样的 emoji 作为临时图标。

## 临时解决方案

在没有自定义图标的情况下，你可以：

1. 使用浏览器默认图标
2. 从 manifest.json 中临时移除图标配置
3. 使用纯色背景的简单图标

## 注意事项

- 所有图标应该是正方形
- 推荐使用 PNG 格式
- 图标应该在浅色和深色背景下都清晰可见
- 可以使用 "purpose": "any maskable" 来支持自适应图标 