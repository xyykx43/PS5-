// ============================================================
// PS5 教程站 · 专属客服代理（Cloudflare Worker）
//
// 作用：前端页面把对话 POST 到这个 Worker，Worker 带着你的 key 去调
// DeepSeek，再把回复返回前端。key 只存在 Worker 环境变量里，
// 不进仓库、不进页面源码，别人拿不走。
//
// 部署（免费）：
//   1. 打开 dash.cloudflare.com，注册/登录，左侧 Workers & Pages → Create
//   2. 选 Worker → 随便起个名字（如 ps5-chat）→ Deploy
//   3. 点 Edit code，把本文件内容全部粘进去 → Deploy
//   4. 回到 Worker 页面 → Settings → Variables and Secrets，添加：
//        DEEPSEEK_API_KEY = 你的 DeepSeek 密钥（必填，加密保存）
//        ALLOWED_ORIGIN   = https://xyykx43.github.io（可选，默认就是这个）
//        VISION_BASE_URL  = 识图模型的 OpenAI 兼容地址（可选）
//        VISION_API_KEY   = 识图模型的 key（可选）
//        VISION_MODEL     = 识图模型名（可选，如 glm-4v-flash）
//   5. 复制 Worker 的访问地址（形如 https://ps5-chat.你的名字.workers.dev），
//      填进 PS5- 仓库 config.js 的 CHAT_ENDPOINT，推送即可。
//
// 识图：DeepSeek 官方 API 不支持图片输入。只有当你配了 VISION_* 三个变量，
// 发图才会转给识图模型；没配就提示用户打字。识图模型建议：
//   智谱 https://open.bigmodel.cn/api/paas/v4  + glm-4v-flash（有免费档）
//   通义 https://dashscope.aliyuncs.com/compatible-mode/v1 + qwen-vl-plus
//   豆包 https://ark.cn-beijing.volces.com/api/v3 + 对应 endpoint id
// ============================================================

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const DEFAULT_ORIGIN = "https://xyykx43.github.io";

export default {
  async fetch(req, env) {
    const origin = req.headers.get("Origin") || "";
    const allow = env.ALLOWED_ORIGIN || DEFAULT_ORIGIN;
    const cors = {
      "Access-Control-Allow-Origin": origin === allow ? origin : allow,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    if (req.method !== "POST") return json({ error: "method not allowed" }, 405, cors);

    let body;
    try { body = await req.json(); } catch (e) { return json({ error: "bad json" }, 400, cors); }
    const messages = Array.isArray(body.messages) ? body.messages : [];
    if (!messages.length) return json({ error: "no messages" }, 400, cors);

    const hasImage = messages.some(function (m) {
      return Array.isArray(m.content) && m.content.some(function (c) { return c.type === "image_url"; });
    });
    const key = env.DEEPSEEK_API_KEY;
    if (!key) return json({ reply: "客服未配置 key。" }, 200, cors);

    let url, apiKey, model;
    if (hasImage) {
      if (!env.VISION_API_KEY || !env.VISION_BASE_URL) {
        return json({ reply: "识图还没开通，先打字说卡在哪一步。" }, 200, cors);
      }
      url = env.VISION_BASE_URL.replace(/\/$/, "") + "/chat/completions";
      apiKey = env.VISION_API_KEY;
      model = env.VISION_MODEL || "glm-4v-flash";
    } else {
      url = DEEPSEEK_URL;
      apiKey = key;
      model = "deepseek-chat";
    }

    const payload = {
      model: model,
      messages: messages.map(function (m) { return { role: m.role, content: m.content }; }),
      temperature: 0.2,
      max_tokens: 300,
    };

    let r, data;
    try {
      r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey },
        body: JSON.stringify(payload),
      });
      data = await r.json();
    } catch (e) {
      return json({ reply: "客服暂时连不上，稍后再试。" }, 200, cors);
    }
    if (!r.ok) {
      return json({ reply: "客服出错了（" + r.status + "）。" }, 200, cors);
    }
    const reply = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || "";
    return json({ reply: reply || "没听懂，发图或换个说法。" }, 200, cors);
  },
};

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status: status,
    headers: Object.assign({}, cors, { "Content-Type": "application/json" }),
  });
}
