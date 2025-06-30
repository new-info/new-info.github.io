// 密码配置文件
window.AUTH_CONFIG = {
    passwords: {
        hjf: "dea40bc7baa0dbcab39307936b8295ba",
        hjm: "53d7bab324e0266cd7eef0254e0cf1ac"
    }
};

// 导出数据供Node.js使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.AUTH_CONFIG;
} 