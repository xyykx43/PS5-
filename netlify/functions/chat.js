// ============================================================
// PS5 教程站 · 专属客服代理（Netlify Function）
//
// 作用：前端 POST 对话到这里，函数带着 key 调 DeepSeek，把回复返回。
// key 只存在 Netlify 的环境变量里，不进网页源码。
//
// 部署（约 5 分钟，手机可做）：
//   1. 手机浏览器打开 app.netlify.com，点「Log in」→「GitHub」授权登录
//   2. 「Add new site」→「Import an existing project」→ GitHub → 选 PS5- 仓库
//   3. 构建设置不用改（无构建命令），直接 Deploy
//   4. 部署完进 Site configuration → Environment variables →
//      Add a variable：Key 填 DEEPSEEK_API_KEY，Value 填你的 DeepSeek key → 保存
//   5. 重新 Deploy（Deploys → Trigger deploy → Deploy site）
//   6. 函数地址：https://你的站点名.netlify.app/.netlify/functions/chat
//      填进 config.js 的 CHAT_ENDPOINT，推送即可
//
// 识图：DeepSeek 官方 API 不支持图片输入，发图会提示打字。
// ============================================================

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const ALLOW_ORIGIN = "https://xyykx43.github.io";

exports.handler = async (event) => {
  const cors = {
    "Access-Control-Allow-Origin": ALLOW_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: cors, body: "" };
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: cors, body: JSON.stringify({ error: "method not allowed" }) };
  }

  let body;
  try { body = JSON.parse(event.body || "{}"); } catch (e) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "bad json" }) };
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (!messages.length) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "no messages" }) };
  }

  const hasImage = messages.some(function (m) {
    return Array.isArray(m.content) && m.content.some(function (c) { return c.type === "image_url"; });
  });
  if (hasImage) {
    return { statusCode: 200, headers: cors, body: JSON.stringify({ reply: "识图还没开通，先打字说卡在哪一步。" }) };
  }

  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) {
    return { statusCode: 200, headers: cors, body: JSON.stringify({ reply: "客服未配置 key。" }) };
  }

  try {
    const r = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: messages.map(function (m) { return { role: m.role, content: m.content }; }),
        temperature: 0.2,
        max_tokens: 300
      })
    });
    const data = await r.json();
    const reply = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || "";
    return { statusCode: 200, headers: cors, body: JSON.stringify({ reply: reply || "没听懂，发图或换个说法。" }) };
  } catch (e) {
    return { statusCode: 200, headers: cors, body: JSON.stringify({ reply: "客服暂时连不上，稍后再试。" }) };
  }
};
