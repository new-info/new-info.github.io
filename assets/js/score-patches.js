/**
 * 分数校正补丁文件
 *
 * 用于校正分析报告中的分数，并添加备注说明
 * 格式: {
 *   "文件名": {
 *     score: 真实分数(可选，不提供则使用原始分数),
 *     note: "备注说明",
 *     reward: 自定义奖金金额(可选，不提供则根据分数计算)
 *   }
 * }
 */

window.SCORE_PATCHES = {
  "2025年6月23日": {
    note: "首次激励足额发放",
    reward: 100  // 自定义奖金金额
  },

  "2025年6月22日": {
    // 未指定score时，使用原始分数
    note: "首次激励足额发放",
    reward: 100  // 自定义奖金金额
  },

  // 示例: 只添加备注，不修改分数和奖金
  "示例文件": {
    note: "这是一个示例，不修改分数和奖金"
    // 未指定score时，使用原始分数
    // 未指定reward时，使用默认计算方式
  }
};

// 导出数据供Node.js使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.SCORE_PATCHES;
}
