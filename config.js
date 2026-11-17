// ============================================================
// 站点配置 —— 填好下面两项就会自动切换到「云端真校验」模式
// 1. 去 supabase.com 免费建一个项目
// 2. Project Settings → API，复制 Project URL 和 anon public key
// 3. 粘到下面两个引号里，保存，推送
// ============================================================
window.SITE_CONFIG = {
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",

  // 云端未配置时的临时密码哈希（默认对应旧密码），配好云端后这行就不再生效
  LOCAL_PASSWORD_SHA256: "ef7ab714af917b6d8f73541f092b73d9408b31ec388309486a6460a4b71cfc7b"
};
