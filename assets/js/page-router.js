// 页面路由工具 - 用于自动将分析和评分页面请求重定向到iframe包装器
(function() {
    // 获取作者信息（从URL路径）
    function getAuthorFromPath(path) {
        if (path.includes('/hjf/')) return 'hjf';
        if (path.includes('/hjm/')) return 'hjm';
        return null;
    }
    
    // 处理页面跳转
    function handleNavigation(href) {
        // 构建iframe页面URL
        const iframeWrapperUrl = `/viewer.html?page=${encodeURIComponent(href)}`;
        
        // 重定向到包装页
        window.location.href = iframeWrapperUrl;
    }
    
    // 监听所有链接点击事件
    document.addEventListener('click', function(e) {
        // 检查点击的是否是链接
        let targetElement = e.target;
        
        // 遍历父元素找到链接
        while (targetElement && targetElement.tagName !== 'A') {
            targetElement = targetElement.parentElement;
            if (!targetElement) return;  // 非链接元素
        }
        
        const href = targetElement.getAttribute('href');
        if (!href) return;  // 没有href属性
        
        // 检查是否是分析或评分页面链接
        if ((href.includes('/hjf/') || href.includes('/hjm/')) && href.endsWith('.html')) {
            // 阻止默认行为
            e.preventDefault();
            
            // 获取作者
            const author = getAuthorFromPath(href);
            
            // 检查是否需要认证
            if (author && window.AuthHelper) {
                // 如果已经认证过，直接跳转
                if (window.AuthHelper.isAuthenticated(author)) {
                    handleNavigation(href);
                } else {
                    // 显示密码输入框
                    window.AuthHelper.showPasswordPrompt(author, function(success) {
                        if (success) {
                            handleNavigation(href);
                        }
                    });
                }
            } else {
                // 未加载认证模块，直接跳转
                handleNavigation(href);
            }
        }
    });
})(); 