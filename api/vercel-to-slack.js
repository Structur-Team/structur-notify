// api/vercel-to-slack.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const slackWebhook = process.env.SLACK_WEBHOOK_URL; // config at Vercel
    const body = req.body;

    const { deployment } = body.payload || {};
    if (!deployment) {
      console.error("No deployment data:", body);
      return res.status(400).json({ error: "Invalid payload" });
    }
    
    const {
      name,
      url,
      state,
      meta: { githubCommitAuthorName, githubCommitMessage, githubCommitRef, githubCommitSha } = {}
    } = deployment;

    // Format Slack message
    const message = {
      text: `🚀 Deployment *${state}* for project *${name}* ${JSON.stringify(body, null, 2)} `,
      attachments: [
        {
          color: state === "READY" ? "good" : "danger",
          fields: [
            { title: "URL", value: `https://${url}`, short: false },
            { title: "Branch", value: githubCommitRef || "-", short: true },
            { title: "Commit", value: githubCommitSha || "-", short: true },
            { title: "Author", value: githubCommitAuthorName || "-", short: true },
            { title: "Message", value: githubCommitMessage || "-", short: false }
          ]
        }
      ]
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
