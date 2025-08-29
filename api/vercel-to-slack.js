// api/vercel-to-slack.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const slackWebhook = process.env.SLACK_WEBHOOK_URL; // config at Vercel
    const body = req.body;

    const { type, payload } = body;
    const { deployment, target } = payload;
    if (!deployment) {
      console.error("No deployment data:", body);
      return res.status(400).json({ error: "Invalid payload" });
    }
    
    let state = "";
    if (type === "deployment.ready" || type === "deployment.succeeded" || deployment?.state === "READY") {
      console.log("✅ Deployment success");
      state = "SUCCEEDED";
    } else if (type === "deployment.error" || deployment?.state === "ERROR") {
      console.log("❌ Deployment failed");
      state = "ERROR";
    } else {
      console.log("⚠️ Don't care deployment");
      state = "";
    }

    if (!state || state === "") {
      console.log("Don't care deployment:");
      return res.status(200).json({ message: "Dont care" });
    }
    
    const {
      name,
      url,
      meta: { githubCommitAuthorName, githubCommitMessage, githubCommitRef, githubRepo } = {}
    } = deployment;
    const targetEnv = target || "dev";
    
    // Format Slack message
    const message = {
      text: `🚀 Deployment *${state}* for project *${name}* at *${targetEnv}*`,
      attachments: [
    	{
    	  color: state === "SUCCEEDED" ? "good" : "danger",
    	  fields: [
    		{ title: "📦 Repo", value: githubRepo || "-", short: true },
    		{ title: "🌿 Branch", value: githubCommitRef || "-", short: true },
    		{ title: "👤 Author", value: githubCommitAuthorName || "-", short: true },
    		{ title: "💬 Message", value: githubCommitMessage || "-", short: false }
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
