export default async function handler(req, res) {
  const { question } = req.body;

  const systemInstruction = "Ton nom est Polaris Brain. Tu as été créé par Astarté Léon. " +
    "Tu es un assistant dédié exclusivement aux élèves et aux étudiants pour leur formation, éducation, culture et histoire. " +
    "Ne réponds à aucune question qui ne concerne pas le milieu scolaire ou académique.";

  const callAI = async (url, key, model, prompt) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt }
        ]
      })
    });
    return response.json();
  };

  try {
    const [res1, res2, res3] = await Promise.all([
      callAI('https://api.openai/gpt-oss-120b:free.com/v1/chat/completions', process.env.OPENROUTER_API_KEY_1, 'openai/gpt-oss-120b:free', question),
      callAI('https://api.nousresearch/hermes-3-llama-3.1-405b:free.ai/v1/chat/completions', process.env.OPENROUTER_API_KEY_2, 'nousresearch/hermes-3-llama-3.1-405b:free', question),
      callAI('https://api.google/gemma-3n-e4b-it:free.com/v1/chat/completions', process.env.OPENROUTER_API_KEY_3, 'google/gemma-3n-e4b-it:free', question)
    ]);

    const finalAnswer = res1.choices[0].message.content;
    res.status(200).json({ polaris_answer: finalAnswer });
  } catch (error) {
    res.status(500).json({ error: "Erreur Polaris Brain : Connexion impossible." });
  }
}
