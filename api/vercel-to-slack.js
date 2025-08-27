// api/vercel-to-slack.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const slackWebhook = process.env.SLACK_WEBHOOK_URL; // config at Vercel
    const body = req.body;

    const { name, url, state } = body || {};

    const message = {
      text: `🚀 Deployment *${state}* for project *${name}*\n🔗 ${url}`,
    };

    await fetch(slackWebhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to send Slack message" });
  }
}
