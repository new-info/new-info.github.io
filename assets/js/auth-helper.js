// 认证帮助函数
(function() {
    // MD5哈希函数实现
    function md5(input) {
        // 创建一个变量用于存储MD5函数的引用
        let md5Function;

        // 引用Blueimp MD5实现
        !function(n){"use strict";function t(n,t){var r=(65535&n)+(65535&t);return(n>>16)+(t>>16)+(r>>16)<<16|65535&r}function r(n,t){return n<<t|n>>>32-t}function e(n,e,o,u,c,f){return t(r(t(t(e,n),t(u,f)),c),o)}function o(n,t,r,o,u,c,f){return e(t&r|~t&o,n,t,u,c,f)}function u(n,t,r,o,u,c,f){return e(t&o|r&~o,n,t,u,c,f)}function c(n,t,r,o,u,c,f){return e(t^r^o,n,t,u,c,f)}function f(n,t,r,o,u,c,f){return e(r^(t|~o),n,t,u,c,f)}function i(n,r){n[r>>5]|=128<<r%32,n[14+(r+64>>>9<<4)]=r;var e,i,a,d,h,l=1732584193,g=-271733879,v=-1732584194,m=271733878;for(e=0;e<n.length;e+=16)i=l,a=g,d=v,h=m,g=f(g=f(g=f(g=f(g=c(g=c(g=c(g=c(g=u(g=u(g=u(g=u(g=o(g=o(g=o(g=o(g,v=o(v,m=o(m,l=o(l,g,v,m,n[e],7,-680876936),g,v,n[e+1],12,-389564586),l,g,n[e+2],17,606105819),m,l,n[e+3],22,-1044525330),v=o(v,m=o(m,l=o(l,g,v,m,n[e+4],7,-176418897),g,v,n[e+5],12,1200080426),l,g,n[e+6],17,-1473231341),m,l,n[e+7],22,-45705983),v=o(v,m=o(m,l=o(l,g,v,m,n[e+8],7,1770035416),g,v,n[e+9],12,-1958414417),l,g,n[e+10],17,-42063),m,l,n[e+11],22,-1990404162),v=o(v,m=o(m,l=o(l,g,v,m,n[e+12],7,1804603682),g,v,n[e+13],12,-40341101),l,g,n[e+14],17,-1502002290),m,l,n[e+15],22,1236535329),v=u(v,m=u(m,l=u(l,g,v,m,n[e+1],5,-165796510),g,v,n[e+6],9,-1069501632),l,g,n[e+11],14,643717713),m,l,n[e],20,-373897302),v=u(v,m=u(m,l=u(l,g,v,m,n[e+5],5,-701558691),g,v,n[e+10],9,38016083),l,g,n[e+15],14,-660478335),m,l,n[e+4],20,-405537848),v=u(v,m=u(m,l=u(l,g,v,m,n[e+9],5,568446438),g,v,n[e+14],9,-1019803690),l,g,n[e+3],14,-187363961),m,l,n[e+8],20,1163531501),v=u(v,m=u(m,l=u(l,g,v,m,n[e+13],5,-1444681467),g,v,n[e+2],9,-51403784),l,g,n[e+7],14,1735328473),m,l,n[e+12],20,-1926607734),v=c(v,m=c(m,l=c(l,g,v,m,n[e+5],4,-378558),g,v,n[e+8],11,-2022574463),l,g,n[e+11],16,1839030562),m,l,n[e+14],23,-35309556),v=c(v,m=c(m,l=c(l,g,v,m,n[e+1],4,-1530992060),g,v,n[e+4],11,1272893353),l,g,n[e+7],16,-155497632),m,l,n[e+10],23,-1094730640),v=c(v,m=c(m,l=c(l,g,v,m,n[e+13],4,681279174),g,v,n[e],11,-358537222),l,g,n[e+3],16,-722521979),m,l,n[e+6],23,76029189),v=c(v,m=c(m,l=c(l,g,v,m,n[e+9],4,-640364487),g,v,n[e+12],11,-421815835),l,g,n[e+15],16,530742520),m,l,n[e+2],23,-995338651),v=f(v,m=f(m,l=f(l,g,v,m,n[e],6,-198630844),g,v,n[e+7],10,1126891415),l,g,n[e+14],15,-1416354905),m,l,n[e+5],21,-57434055),v=f(v,m=f(m,l=f(l,g,v,m,n[e+12],6,1700485571),g,v,n[e+3],10,-1894986606),l,g,n[e+10],15,-1051523),m,l,n[e+1],21,-2054922799),v=f(v,m=f(m,l=f(l,g,v,m,n[e+8],6,1873313359),g,v,n[e+15],10,-30611744),l,g,n[e+6],15,-1560198380),m,l,n[e+13],21,1309151649),v=f(v,m=f(m,l=f(l,g,v,m,n[e+4],6,-145523070),g,v,n[e+11],10,-1120210379),l,g,n[e+2],15,718787259),m,l,n[e+9],21,-343485551),l=t(l,i),g=t(g,a),v=t(v,d),m=t(m,h);return[l,g,v,m]}function a(n){var t,r="",e=32*n.length;for(t=0;t<e;t+=8)r+=String.fromCharCode(n[t>>5]>>>t%32&255);return r}function d(n){var t,r=[];for(r[(n.length>>2)-1]=void 0,t=0;t<r.length;t+=1)r[t]=0;var e=8*n.length;for(t=0;t<e;t+=8)r[t>>5]|=(255&n.charCodeAt(t/8))<<t%32;return r}function h(n){return a(i(d(n),8*n.length))}function l(n,t){var r,e,o=d(n),u=[],c=[];for(u[15]=c[15]=void 0,o.length>16&&(o=i(o,8*n.length)),r=0;r<16;r+=1)u[r]=909522486^o[r],c[r]=1549556828^o[r];return e=i(u.concat(d(t)),512+8*t.length),a(i(c.concat(e),640))}function g(n){var t,r,e="";for(r=0;r<n.length;r+=1)t=n.charCodeAt(r),e+="0123456789abcdef".charAt(t>>>4&15)+"0123456789abcdef".charAt(15&t);return e}function v(n){return unescape(encodeURIComponent(n))}function m(n){return h(v(n))}function p(n){return g(m(n))}function s(n,t){return l(v(n),v(t))}function C(n,t){return g(s(n,t))}function A(n,t,r){return t?r?s(t,n):C(t,n):r?m(n):p(n)}"function"==typeof define&&define.amd?define(function(){return A}):"object"==typeof module&&module.exports?module.exports=A:md5Function=A}(this);

        // 使用MD5函数处理输入
        return md5Function(input);
    }

    // 存储密码前三位（用于WASM解密）
    function storePasswordPrefix(password) {
        try {
            const prefix = password.substring(0, 3);
            localStorage.setItem('user_password_prefix', prefix);
            console.log('已存储密码前三位:', prefix);
            return prefix;
        } catch (e) {
            console.error('存储密码前三位失败:', e);
            return null;
        }
    }

    // 获取存储的密码前三位
    function getStoredPasswordPrefix() {
        try {
            return localStorage.getItem('user_password_prefix') || '';
        } catch (e) {
            console.error('获取密码前三位失败:', e);
            return '';
        }
    }

    // 清除存储的密码前三位
    function clearPasswordPrefix() {
        try {
            localStorage.removeItem('user_password_prefix');
            console.log('已清除存储的密码前三位');
        } catch (e) {
            console.error('清除密码前三位失败:', e);
        }
    }

    // 保存认证状态
    const AUTH_STORAGE_KEY = 'notes_auth_status';

    // 比较hjf和hjm的数据量，确定谁有权限查看对方内容
    function compareDataCounts() {
        if (!window.NOTES_DATA) {
            console.warn('未找到NOTES_DATA');
            return null;
        }

        // 获取各自的数据量
        const hjfCount = (window.NOTES_DATA.hjf || []).length;
        const hjmCount = (window.NOTES_DATA.hjm || []).length;

        // 如果数据量相等，都不能查看对方
        if (hjfCount === hjmCount) {
            return null;
        }

        // 返回数据量多的作者
        return hjfCount > hjmCount ? 'hjf' : 'hjm';
    }

    // 检查基于索引的交叉认证权限
    function checkCrossAuthByIndex(requestedAuthor, pageIndex, authenticatedAuthor) {
        if (!window.NOTES_DATA || pageIndex === -1) {
            return false;
        }

        // 获取各自的数据量
        const hjfCount = (window.NOTES_DATA.hjf || []).length;
        const hjmCount = (window.NOTES_DATA.hjm || []).length;

        // 如果数据量相等，允许互相查看全部内容
        if (hjfCount === hjmCount) {
            // 数据量相同时，用户可以互相查看对方的所有内容
            return (requestedAuthor === 'hjf' && authenticatedAuthor === 'hjm') ||
                   (requestedAuthor === 'hjm' && authenticatedAuthor === 'hjf');
        }

        // 确定数据量高低
        const higherDataAuthor = hjfCount > hjmCount ? 'hjf' : 'hjm';
        const lowerDataAuthor = hjfCount > hjmCount ? 'hjm' : 'hjf';
        const higherCount = Math.max(hjfCount, hjmCount);
        const lowerCount = Math.min(hjfCount, hjmCount);

        // 如果请求的是数据量高的用户内容，且认证用户是数据量低的用户
        if (requestedAuthor === higherDataAuthor && authenticatedAuthor === lowerDataAuthor) {
            // 数据量低的用户可以查看数据量高的用户等量数据，从数组后开始计算
            // 索引小的为新数据，所以要检查pageIndex是否在允许范围内
            const allowedStartIndex = higherCount - lowerCount; // 允许查看的起始索引
            return pageIndex >= allowedStartIndex;
        }

        return false;
    }

    // 检查是否已认证
    function isAuthenticated(author, pageIndex = -1) {
        try {
            // 获取认证状态
            const authStatus = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || '{}');

            // 直接认证 - 用户本身的认证状态
            if (authStatus[author] && authStatus[author].authenticated) {
                return true;
            }

            // 交叉认证检查 - 基于索引的权限
            for (const [authAuthor, status] of Object.entries(authStatus)) {
                if (status.authenticated && authAuthor !== author) {
                    if (checkCrossAuthByIndex(author, pageIndex, authAuthor)) {
                        return true;
                    }
                }
            }

            return false;
        } catch (e) {
            console.error('认证状态检查出错:', e);
            return false;
        }
    }

    // 设置认证状态
    function setAuthenticated(author) {
        try {
            const authStatus = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || '{}');

            authStatus[author] = {
                authenticated: true
            };

            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authStatus));
            return true;
        } catch (e) {
            return false;
        }
    }

    // 验证密码
    function verifyPassword(author, password) {
        if (!window.AUTH_CONFIG || !window.AUTH_CONFIG.passwords) {
            console.error('认证配置未加载');
            return false;
        }

        const correctHash = window.AUTH_CONFIG.passwords[author];
        if (!correctHash) {
            console.error(`未找到${author}的密码配置`);
            return false;
        }

        const inputHash = md5(password);
        return inputHash === correctHash;
    }

    // 检测是否为移动设备
    function isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    // 显示密码输入对话框
    function showPasswordPrompt(author, pageIndex, callback) {
        // 如果只传了两个参数，兼容旧的调用方式
        if (typeof pageIndex === 'function') {
            callback = pageIndex;
            pageIndex = -1;
        }

        // 检查当前用户是否已通过其他方式认证
        if (isAuthenticated(author, pageIndex)) {
            // 已认证，直接调用回调函数
            callback(true);
            return;
        }

        // 获取数据量多的作者
        const superiorAuthor = compareDataCounts();

        // 保存页面原始滚动位置
        const scrollPosition = window.scrollY || window.pageYOffset;
        const isMobile = isMobileDevice();

        // 创建模态对话框
        const modalOverlay = document.createElement('div');
        modalOverlay.style.position = 'fixed';
        modalOverlay.style.top = '0';
        modalOverlay.style.left = '0';
        modalOverlay.style.width = '100%';
        modalOverlay.style.height = '100%';
        modalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        modalOverlay.style.zIndex = '9999';
        modalOverlay.style.overflow = 'hidden';

        // 对移动设备使用不同的布局
        if (isMobile) {
            modalOverlay.style.display = 'block';
        } else {
            modalOverlay.style.display = 'flex';
            modalOverlay.style.alignItems = 'center';
            modalOverlay.style.justifyContent = 'center';
        }

        // 创建对话框内容
        const modalContent = document.createElement('div');
        modalContent.style.backgroundColor = '#fff';
        modalContent.style.borderRadius = '8px';
        modalContent.style.padding = '20px';
        modalContent.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';

        // 移动设备上的特殊处理
        if (isMobile) {
            modalContent.style.width = '90%';
            modalContent.style.maxWidth = '400px';
            modalContent.style.margin = '30% auto 0'; // 从顶部开始，避免键盘弹出时的跳动
            modalContent.style.position = 'relative';
        } else {
            modalContent.style.width = '300px';
            modalContent.style.maxWidth = '90%';
        }

        // 标题
        const title = document.createElement('h3');
        title.textContent = '请输入密码';
        title.style.margin = '0 0 15px 0';
        title.style.color = '#1a2980';

        // 提示文本
        const hint = document.createElement('p');
        hint.textContent = `请输入${author}的密码`;
        hint.style.margin = '0 0 15px 0';
        hint.style.fontSize = '14px';
        hint.style.color = '#666';

        // 检查是否可以通过交叉认证访问
        let canCrossAuth = false;
        if (pageIndex !== -1 && window.NOTES_DATA) {
            const hjfCount = (window.NOTES_DATA.hjf || []).length;
            const hjmCount = (window.NOTES_DATA.hjm || []).length;

            if (hjfCount === hjmCount) {
                // 数据量相等时，允许互相查看
                const otherAuthor = author === 'hjf' ? 'hjm' : 'hjf';
                canCrossAuth = true;
                const crossAuthHint = document.createElement('p');
                crossAuthHint.textContent = `提示: 您也可以输入${otherAuthor}的密码来访问此内容`;
                crossAuthHint.style.margin = '5px 0 0 0';
                crossAuthHint.style.fontSize = '12px';
                crossAuthHint.style.fontStyle = 'italic';
                crossAuthHint.style.color = '#1a2980';
                crossAuthHint.style.display = 'none';
                hint.appendChild(document.createElement('br'));
                hint.appendChild(crossAuthHint);
            } else if (hjfCount !== hjmCount) {
                const higherDataAuthor = hjfCount > hjmCount ? 'hjf' : 'hjm';
                const lowerDataAuthor = hjfCount > hjmCount ? 'hjm' : 'hjf';
                const higherCount = Math.max(hjfCount, hjmCount);
                const lowerCount = Math.min(hjfCount, hjmCount);

                if (author === higherDataAuthor) {
                    const allowedStartIndex = higherCount - lowerCount;
                    if (pageIndex >= allowedStartIndex) {
                        canCrossAuth = true;
                        const crossAuthHint = document.createElement('p');
                        crossAuthHint.textContent = `提示: 您也可以输入${lowerDataAuthor}的密码来访问此内容`;
                        crossAuthHint.style.margin = '5px 0 0 0';
                        crossAuthHint.style.fontSize = '12px';
                        crossAuthHint.style.fontStyle = 'italic';
                        crossAuthHint.style.color = '#1a2980';
                        crossAuthHint.style.display = 'none';
                        hint.appendChild(document.createElement('br'));
                        hint.appendChild(crossAuthHint);
                    }
                }
            }
        }

        // 错误提示
        const errorText = document.createElement('p');
        errorText.style.color = '#ff4d4f';
        errorText.style.fontSize = '14px';
        errorText.style.margin = '0';
        errorText.style.height = '20px';
        errorText.style.display = 'none';

        // 密码输入框
        const passwordInput = document.createElement('input');
        passwordInput.type = 'password';
        passwordInput.placeholder = '请输入密码';
        passwordInput.style.width = '100%';
        passwordInput.style.padding = '8px 12px';
        passwordInput.style.border = '1px solid #d9d9d9';
        passwordInput.style.borderRadius = '4px';
        passwordInput.style.marginBottom = '15px';
        passwordInput.style.boxSizing = 'border-box';

        // 按钮容器
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'flex-end';
        buttonContainer.style.gap = '10px';

        // 取消按钮
        const cancelButton = document.createElement('button');
        cancelButton.textContent = '取消';
        cancelButton.style.padding = '6px 16px';
        cancelButton.style.border = '1px solid #d9d9d9';
        cancelButton.style.borderRadius = '4px';
        cancelButton.style.backgroundColor = '#fff';
        cancelButton.style.cursor = 'pointer';

        // 确认按钮
        const confirmButton = document.createElement('button');
        confirmButton.textContent = '确定';
        confirmButton.style.padding = '6px 16px';
        confirmButton.style.border = 'none';
        confirmButton.style.borderRadius = '4px';
        confirmButton.style.backgroundColor = '#1a2980';
        confirmButton.style.color = '#fff';
        confirmButton.style.cursor = 'pointer';

        // 组合元素
        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(confirmButton);

        modalContent.appendChild(title);
        modalContent.appendChild(hint);
        modalContent.appendChild(passwordInput);
        modalContent.appendChild(errorText);
        modalContent.appendChild(buttonContainer);

        modalOverlay.appendChild(modalContent);

        // 在移动设备上防止页面滚动
        if (isMobile) {
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            document.body.style.top = `-${scrollPosition}px`;
        }

        // 添加到页面
        document.body.appendChild(modalOverlay);

        // 聚焦到输入框，但在移动设备上稍微延迟，防止立即弹出键盘导致跳动
        if (isMobile) {
            setTimeout(() => {
                passwordInput.focus();
            }, 300);
        } else {
            passwordInput.focus();
        }

        // 清理函数
        function cleanupModal() {
            document.body.removeChild(modalOverlay);
            if (isMobile) {
                document.body.style.overflow = '';
                document.body.style.position = '';
                document.body.style.width = '';
                document.body.style.top = '';
                window.scrollTo(0, scrollPosition);
            }
        }

        // 添加事件监听
        cancelButton.addEventListener('click', () => {
            cleanupModal();
            callback(false);
        });

        confirmButton.addEventListener('click', () => {
            const password = passwordInput.value.trim();
            if (!password) {
                errorText.textContent = '请输入密码';
                errorText.style.display = 'block';
                return;
            }

            // 先尝试当前作者的密码
            if (verifyPassword(author, password)) {
                // 验证成功，存储密码前三位
                storePasswordPrefix(password);
                setAuthenticated(author);
                cleanupModal();
                callback(true);
                return;
            }

            // 如果支持交叉认证，尝试其他用户的密码
            if (canCrossAuth && window.NOTES_DATA) {
                const hjfCount = (window.NOTES_DATA.hjf || []).length;
                const hjmCount = (window.NOTES_DATA.hjm || []).length;

                if (hjfCount !== hjmCount) {
                    const lowerDataAuthor = hjfCount > hjmCount ? 'hjm' : 'hjf';

                    if (verifyPassword(lowerDataAuthor, password)) {
                        // 验证成功，存储密码前三位
                        storePasswordPrefix(password);
                        setAuthenticated(lowerDataAuthor);
                        cleanupModal();
                        callback(true);
                        return;
                    }
                }
            }

            // 密码验证失败
            errorText.textContent = '密码错误，请重试';
            errorText.style.display = 'block';
            passwordInput.value = '';
        });

        // 回车提交
        passwordInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                confirmButton.click();
            }
        });
    }

    // 导出到全局
    window.AuthHelper = {
        isAuthenticated,
        verifyPassword,
        showPasswordPrompt,
        compareDataCounts,
        checkCrossAuthByIndex,
        setAuthenticated,
        storePasswordPrefix,
        getStoredPasswordPrefix,
        clearPasswordPrefix
    };
})();
