#!/bin/bash

# 创建简单的SVG图标
cat > icon-template.svg << EOF
<svg xmlns="http://www.w3.org/2000/svg" width="SIZE" height="SIZE" viewBox="0 0 SIZE SIZE">
  <rect width="100%" height="100%" fill="#26d0ce"/>
  <text x="50%" y="50%" font-family="Arial" font-size="FONTSIZE" fill="white" text-anchor="middle" dominant-baseline="middle">分析</text>
</svg>
EOF

# 生成不同尺寸的图标
sizes=(72 96 128 144 152 192 384 512)

for size in "${sizes[@]}"; do
  # 计算合适的字体大小
  fontsize=$((size / 3))
  
  # 替换尺寸变量
  sed "s/SIZE/$size/g; s/FONTSIZE/$fontsize/g" icon-template.svg > "icon-$size.svg"
  
  # 如果有可用的转换工具，可以转换为PNG
  if command -v convert &> /dev/null; then
    convert "icon-$size.svg" "icon-${size}x${size}.png"
    rm "icon-$size.svg"
  else
    # 否则创建空的PNG文件
    touch "icon-${size}x${size}.png"
  fi
  
  echo "Created icon-${size}x${size}.png"
done

# 清理模板
rm -f icon-template.svg 