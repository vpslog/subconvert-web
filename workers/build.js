const fs = require('fs');
const path = require('path');

// 复制前端文件到 public 目录
function copyFile(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
}

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const files = fs.readdirSync(src);
  files.forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  });
}

// 创建 public 目录
if (!fs.existsSync('public')) {
  fs.mkdirSync('public');
}

// 复制前端文件
copyFile('../index.html', 'public/index.html');
copyDir('../src', 'public/src');

console.log('Build completed');