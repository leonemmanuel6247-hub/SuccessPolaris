
import { GoogleGenAI } from "@google/genai";
import { ChatMessage, Document } from '../types.ts';

export interface AIProviderResponse {
  text: string;
  source: string;
}

// Clés spécifiques pour OpenRouter (Noyaux Gamma, Delta et Epsilon)
const STEPFUN_API_KEY = "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";
const DEEPSEEK_API_KEY = "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";
const SOLAR_API_KEY = "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";

export const aiService = {
  // Préparation du prompt système pour Polaris Brain
  getSystemPrompt: (documents: Document[]) => {
    const docsContext = documents.length > 0 
      ? documents.map(d => `- ${d.title}: ${d.description}`).join('\n')
      : "Base de données en cours de synchronisation...";
    
    return `Tu es Polaris Brain, l'assistant intelligent de SuccessPolaris.
TON STYLE : Futuriste, poli, motivant (Style Astarté).
TA MISSION : Aider les élèves pour le BAC 2025.
CONSIGNE CRITIQUE : Suggère TOUJOURS de consulter les fichiers PDF disponibles sur le site.

CONTEXTE DES ARCHIVES :
${docsContext}

TONALITÉ : Mentor stellaire. Utilise "Matrice", "Nexus", "Succès".`;
  },

  // MOTEUR 1 : GEMINI ALPHA (Modèle Gemini 3 Flash)
  fetchGeminiAlpha: async (messages: ChatMessage[], prompt: string): Promise<AIProviderResponse> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: messages.slice(-5).map(m => ({ 
        role: m.role, 
        parts: [{ text: m.text }] 
      })),
      config: { systemInstruction: prompt, temperature: 0.7 }
    });
    return { text: response.text || "", source: "Noyau Alpha" };
  },

  // MOTEUR 2 : GEMINI BÊTA (Modèle Gemini Flash-Lite)
  fetchGeminiBeta: async (messages: ChatMessage[], prompt: string): Promise<AIProviderResponse> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: messages.slice(-5).map(m => ({ 
        role: m.role, 
        parts: [{ text: m.text }] 
      })),
      config: { systemInstruction: prompt, temperature: 0.8 }
    });
    return { text: response.text || "", source: "Noyau Bêta" };
  },

  // MOTEUR 3 : STEPFUN VIA OPENROUTER (Noyau Gamma)
  fetchStepFun: async (messages: ChatMessage[], prompt: string): Promise<AIProviderResponse> => {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${STEPFUN_API_KEY}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "SuccessPolaris",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "stepfun/step-3.5-flash:free",
          messages: [
            { role: "system", content: prompt },
            ...messages.slice(-5).map(m => ({ 
              role: m.role === 'model' ? 'assistant' : 'user', 
              content: m.text 
            }))
          ]
        })
      });

      if (!response.ok) throw new Error("Défaillance Gamma");
      const data = await response.json();
      return { text: data.choices?.[0]?.message?.content || "", source: "Noyau Gamma" };
    } catch (error) {
      console.error("Erreur Noyau Gamma:", error);
      throw error;
    }
  },

  // MOTEUR 4 : DEEPSEEK R1 VIA OPENROUTER (Noyau Delta)
  fetchDeepSeek: async (messages: ChatMessage[], prompt: string): Promise<AIProviderResponse> => {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "SuccessPolaris",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-r1-0528:free",
          messages: [
            { role: "system", content: prompt },
            ...messages.slice(-5).map(m => ({ 
              role: m.role === 'model' ? 'assistant' : 'user', 
              content: m.text 
            }))
          ]
        })
      });

      if (!response.ok) throw new Error("Défaillance Delta");
      const data = await response.json();
      return { text: data.choices?.[0]?.message?.content || "", source: "Noyau Delta" };
    } catch (error) {
      console.error("Erreur Noyau Delta:", error);
      throw error;
    }
  },

  // MOTEUR 5 : SOLAR PRO 3 VIA OPENROUTER (Noyau Epsilon)
  fetchSolar: async (messages: ChatMessage[], prompt: string): Promise<AIProviderResponse> => {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SOLAR_API_KEY}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "SuccessPolaris",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "upstage/solar-pro-3:free",
          messages: [
            { role: "system", content: prompt },
            ...messages.slice(-5).map(m => ({ 
              role: m.role === 'model' ? 'assistant' : 'user', 
              content: m.text 
            }))
          ]
        })
      });

      if (!response.ok) throw new Error("Défaillance Epsilon");
      const data = await response.json();
      return { text: data.choices?.[0]?.message?.content || "", source: "Noyau Epsilon" };
    } catch (error) {
      console.error("Erreur Noyau Epsilon:", error);
      throw error;
    }
  },

  // LE CONCOURS DE RÉPONSE (Race Mode)
  runCompetition: async (messages: ChatMessage[], documents: Document[]): Promise<AIProviderResponse> => {
    const prompt = aiService.getSystemPrompt(documents);
    
    // On lance simultanément les 5 cœurs. La plus rapide l'emporte.
    return (Promise as any).any([
      aiService.fetchGeminiAlpha(messages, prompt),
      aiService.fetchGeminiBeta(messages, prompt),
      aiService.fetchStepFun(messages, prompt),
      aiService.fetchDeepSeek(messages, prompt),
      aiService.fetchSolar(messages, prompt)
    ]);
  }
};
