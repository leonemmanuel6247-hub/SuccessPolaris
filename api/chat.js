export default async function handler(req, res) {
  const { question } = req.body;
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY_1}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "google/gemma-2-9b-it:free",
        "messages": [{ "role": "user", "content": question }]
      })
    });
    const data = await response.json();
    res.status(200).json({ polaris_answer: data.choices[0].message.content });
  } catch (e) {
    res.status(500).json({ error: "Erreur de connexion" });
  }
}
