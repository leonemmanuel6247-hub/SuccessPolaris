
import { GoogleGenAI } from "@google/genai";
import { ChatMessage, Document } from '../types.ts';
import { storageService } from './storageService.ts';

export interface AIProviderResponse {
  text: string;
  source: string;
}

const STEPFUN_API_KEY = "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";
const DEEPSEEK_API_KEY = "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";
const SOLAR_API_KEY = "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";

export const aiService = {
  getSystemPrompt: (documents: Document[]) => {
    const docsContext = documents.length > 0 
      ? documents.map(d => `- ${d.title}`).join('\n')
      : "Aucun document n'est chargé pour le moment.";
    
    const customMemory = storageService.getIAMemory();
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    return `Tu es Polaris Brain, l'assistant intelligent unique de SuccessPolaris.
DATE ET HEURE ACTUELLE : Nous sommes le ${dateStr}, et il est ${timeStr}.
TON IDENTITÉ ET MÉMOIRE : ${customMemory}
TON OBJECTIF : Expliquer les cours et aider pour le BAC 2025.

CONSIGNES DE STYLE :
1. Langage Simple : Explique les concepts comme si tu parlais à un enfant de 10 ans, mais avec la précision attendue par un lycéen.
2. Pas de Jargon : N'utilise plus de mots comme "Matrice", "Stellar", "Constellation", "Nexus". Sois humain et pro.
3. Formatage : Utilise abondamment le **gras** pour les mots clés, l'*italique* pour les définitions, et des listes à puces.
4. Couleurs et Soulignement : Tu peux utiliser des balises HTML simples comme <u>souligné</u> ou <span style="color:#00d4ff">texte en couleur</span> si nécessaire.
5. Documents : Suggère toujours de consulter les PDF de SuccessPolaris listés ici :
${docsContext}

Rappelle-toi : Ton unique but est le succès de l'élève.`;
  },

  fetchGeminiAlpha: async (messages: ChatMessage[], prompt: string): Promise<AIProviderResponse> => {
    const start = Date.now();
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: messages.slice(-5).map(m => ({ role: m.role, parts: [{ text: m.text }] })),
      config: { systemInstruction: prompt, temperature: 0.6 }
    });
    const time = Date.now() - start;
    storageService.logAIResponse('Gemini 3 Flash', time);
    return { text: response.text || "", source: "Polaris Brain" };
  },

  fetchGeminiBeta: async (messages: ChatMessage[], prompt: string): Promise<AIProviderResponse> => {
    const start = Date.now();
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: messages.slice(-5).map(m => ({ role: m.role, parts: [{ text: m.text }] })),
      config: { systemInstruction: prompt, temperature: 0.6 }
    });
    const time = Date.now() - start;
    storageService.logAIResponse('Gemini Lite', time);
    return { text: response.text || "", source: "Polaris Brain" };
  },

  fetchStepFun: async (messages: ChatMessage[], prompt: string): Promise<AIProviderResponse> => {
    try {
      const start = Date.now();
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${STEPFUN_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "stepfun/step-3.5-flash:free",
          messages: [{ role: "system", content: prompt }, ...messages.slice(-5).map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.text }))]
        })
      });
      const data = await response.json();
      const time = Date.now() - start;
      storageService.logAIResponse('StepFun Flash', time);
      return { text: data.choices?.[0]?.message?.content || "", source: "Polaris Brain" };
    } catch { throw new Error(); }
  },

  fetchDeepSeek: async (messages: ChatMessage[], prompt: string): Promise<AIProviderResponse> => {
    try {
      const start = Date.now();
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${DEEPSEEK_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "deepseek/deepseek-r1-0528:free",
          messages: [{ role: "system", content: prompt }, ...messages.slice(-5).map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.text }))]
        })
      });
      const data = await response.json();
      const time = Date.now() - start;
      storageService.logAIResponse('DeepSeek R1', time);
      return { text: data.choices?.[0]?.message?.content || "", source: "Polaris Brain" };
    } catch { throw new Error(); }
  },

  fetchSolar: async (messages: ChatMessage[], prompt: string): Promise<AIProviderResponse> => {
    try {
      const start = Date.now();
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${SOLAR_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "upstage/solar-pro-3:free",
          messages: [{ role: "system", content: prompt }, ...messages.slice(-5).map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.text }))]
        })
      });
      const data = await response.json();
      const time = Date.now() - start;
      storageService.logAIResponse('Solar Pro', time);
      return { text: data.choices?.[0]?.message?.content || "", source: "Polaris Brain" };
    } catch { throw new Error(); }
  },

  processMessage: async (messages: ChatMessage[], documents: Document[]): Promise<AIProviderResponse> => {
    const prompt = aiService.getSystemPrompt(documents);
    return (Promise as any).any([
      aiService.fetchGeminiAlpha(messages, prompt),
      aiService.fetchGeminiBeta(messages, prompt),
      aiService.fetchStepFun(messages, prompt),
      aiService.fetchDeepSeek(messages, prompt),
      aiService.fetchSolar(messages, prompt)
    ]);
  }
};
