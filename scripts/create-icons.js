const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// If canvas module is not installed, this script will fail
// You can install it with: npm install canvas

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '..', 'assets', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Icon sizes to generate
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Generate icons for each size
sizes.forEach(size => {
  try {
    // Create canvas with the specified size
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Draw background gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#1a2980');
    gradient.addColorStop(1, '#26d0ce');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Draw text
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${size / 3}px Arial`;
    ctx.fillText('分析', size / 2, size / 2);
    
    // Save as PNG
    const buffer = canvas.toBuffer('image/png');
    const filePath = path.join(iconsDir, `icon-${size}x${size}.png`);
    fs.writeFileSync(filePath, buffer);
    
    console.log(`Created icon: ${filePath}`);
  } catch (error) {
    console.error(`Error creating ${size}x${size} icon:`, error.message);
  }
});

console.log('Icon generation complete!');

// Alternative approach - create a simple HTML file that generates icons
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Icon Generator</title>
  <style>
    body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
    .canvas-container { margin-bottom: 20px; }
    canvas { border: 1px solid #ccc; margin-bottom: 10px; }
    button { padding: 10px 15px; background: #26d0ce; color: white; border: none; cursor: pointer; }
  </style>
</head>
<body>
  <h1>Icon Generator</h1>
  <p>This page generates icons for the PWA. Click the buttons below to download each size.</p>
  
  <div id="canvases"></div>
  
  <script>
    // Icon sizes
    const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
    
    // Generate a canvas for each size
    sizes.forEach(size => {
      const container = document.createElement('div');
      container.className = 'canvas-container';
      
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      canvas.id = \`canvas-\${size}\`;
      
      const ctx = canvas.getContext('2d');
      
      // Draw background gradient
      const gradient = ctx.createLinearGradient(0, 0, size, size);
      gradient.addColorStop(0, '#1a2980');
      gradient.addColorStop(1, '#26d0ce');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
      
      // Draw text
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = \`bold \${size / 3}px Arial\`;
      ctx.fillText('分析', size / 2, size / 2);
      
      // Create download button
      const button = document.createElement('button');
      button.textContent = \`Download \${size}x\${size} Icon\`;
      button.onclick = () => {
        const link = document.createElement('a');
        link.download = \`icon-\${size}x\${size}.png\`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      };
      
      container.appendChild(canvas);
      container.appendChild(button);
      document.getElementById('canvases').appendChild(container);
    });
  </script>
</body>
</html>
`;

// Save the HTML file
const htmlPath = path.join(iconsDir, 'icon-generator.html');
fs.writeFileSync(htmlPath, htmlContent);
console.log(`Created HTML icon generator: ${htmlPath}`); 