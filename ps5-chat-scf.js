// ============================================================
// PS5 教程站 · 专属客服代理（腾讯云函数 SCF）
//
// 作用：前端 POST 对话到这里，函数带着你的 key 去调 DeepSeek，
// 再把回复返回前端。key 只存在云函数的环境变量里，不进网页源码。
//
// 部署（约 3 分钟）：
//   1. 注册腾讯云并实名：cloud.tencent.com
//   2. 控制台 → 云函数 → 新建 → 从头创建：
//        - 函数名称：ps5-chat
//        - 运行环境：Node.js 18.15
//        - 执行超时：30 秒（DeepSeek 有时慢，默认 3 秒不够）
//   3. 把本文件全部内容粘贴进「函数代码」→ 保存
//   4. 「函数配置」→ 环境变量：DEEPSEEK_API_KEY = 你的 DeepSeek key
//   5. 「触发器」→ 新建触发器 → API 网关触发 → 选「云函数集成」→ 创建
//      拿到访问路径，形如 https://service-xxx.gz.apigw.tencentcs.com/release/ps5-chat
//   6. 把这个地址填进 PS5- 仓库 config.js 的 CHAT_ENDPOINT，推送即可。
//
// 识图：DeepSeek 官方 API 不支持图片输入，发图会提示打字。
// ============================================================

exports.main = async (event, context) => {
  const cors = {
    "Access-Control-Allow-Origin": "https://xyykx43.github.io",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  const method = event.httpMethod || (event.requestContext && event.requestContext.httpMethod) || "";
  if (method === "OPTIONS") return { statusCode: 204, headers: cors, body: "" };
  if (method !== "POST") return { statusCode: 405, headers: cors, body: JSON.stringify({ error: "method not allowed" }) };

  let body;
  try {
    const raw = event.body || "";
    const text = event.isBase64Encoded ? Buffer.from(raw, "base64").toString("utf8") : raw;
    body = JSON.parse(text);
  } catch (e) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "bad json" }) };
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (!messages.length) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "no messages" }) };

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
    const r = await fetch("https://api.deepseek.com/chat/completions", {
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
