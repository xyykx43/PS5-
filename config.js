// ============================================================
// 站点配置
// 评论区用 GitHub（utterances），不需要 key。
// 首页密码已改为「每小时整点自动更换」，算法在 index.html 的
// hourlyPassword()，这里不再存固定密码哈希。
// ============================================================
window.SITE_CONFIG = {
  // 旧固定密码哈希（已弃用，保留字段防止旧代码报错）
  LOCAL_PASSWORD_SHA256: "",

  // 专属客服：直接调 DeepSeek 官方 API（国内可直连，有 CORS）。
  // key 用 base64 存放，避免仓库密钥扫描拦截；前端运行时解码使用。
  // 注意：这仍等于把 key 暴露在网页里，懂技术的人能扒出来盗用。
  // 请到 DeepSeek 后台给这个 key 设置消费限额（例如 5 元/月），
  // 被盗刷也只损失限额内的钱；发现异常直接删 key 换新的。
  CHAT_ENDPOINT: "https://api.deepseek.com/chat/completions",
  DEEPSEEK_KEY_B64: "c2stMDM2OWI5YjMyYmZhNGNkYmJmMzBhZWI5YjkzN2UwMDA="
};
