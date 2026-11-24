// ============================================================
// 站点配置
// 评论区用 GitHub（utterances），不需要 key。
// 首页密码已改为「每小时整点自动更换」，算法在 index.html 的
// hourlyPassword()，这里不再存固定密码哈希。
// ============================================================
window.SITE_CONFIG = {
  // 旧固定密码哈希（已弃用，保留字段防止旧代码报错）
  LOCAL_PASSWORD_SHA256: "",

  // 专属客服接口地址：填你的 DeepSeek 代理（Cloudflare Worker 或自己的服务器）。
  // 留空时客服窗口会提示「接口未配置」。
  // 接口约定：POST {messages:[{role,content}]}，返回 {reply:"..."} 或 OpenAI 格式的 choices。
  CHAT_ENDPOINT: ""
};
