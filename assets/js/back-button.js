// 动态添加返回按钮的脚本
(function() {
    // 确保当前页面不是首页
    if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
        // 创建按钮容器
        const buttonContainer = document.createElement('div');
        buttonContainer.style.position = 'fixed';
        buttonContainer.style.top = '20px';
        buttonContainer.style.left = '20px';
        buttonContainer.style.zIndex = '100000';
        
        // 创建按钮
        const backButton = document.createElement('a');
        backButton.href = '/index.html';
        backButton.title = '返回主页';
        backButton.innerText = '←';
        
        // 按钮样式
        backButton.style.display = 'flex';
        backButton.style.alignItems = 'center';
        backButton.style.justifyContent = 'center';
        backButton.style.width = '40px';
        backButton.style.height = '40px';
        backButton.style.borderRadius = '50%';
        backButton.style.backgroundColor = 'rgba(26, 41, 128, 0.8)';
        backButton.style.color = 'white';
        backButton.style.textDecoration = 'none';
        backButton.style.fontSize = '20px';
        backButton.style.fontWeight = 'bold';
        backButton.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
        backButton.style.transition = 'all 0.2s ease';
        backButton.style.cursor = 'pointer';
        
        // 添加悬停效果
        backButton.addEventListener('mouseover', function() {
            this.style.backgroundColor = 'rgba(38, 208, 206, 0.9)';
            this.style.transform = 'translateY(-2px)';
        });
        
        backButton.addEventListener('mouseout', function() {
            this.style.backgroundColor = 'rgba(26, 41, 128, 0.8)';
            this.style.transform = 'translateY(0)';
        });
        
        // 将按钮添加到容器并将容器添加到页面
        buttonContainer.appendChild(backButton);
        document.body.appendChild(buttonContainer);
    }
})(); 