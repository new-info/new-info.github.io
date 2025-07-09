// 密码配置文件
window.AUTH_CONFIG = {
    passwords: {
        hjf: "a808281ae26e85fa0c9b257e42f206a6",
        hjm: "53d7bab324e0266cd7eef0254e0cf1ac"
    }
};

// 导出数据供Node.js使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.AUTH_CONFIG;
}
