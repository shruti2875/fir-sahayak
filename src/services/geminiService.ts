import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateResponse(messages: Message[], language: string) {
  const model = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    })),
    config: {
      systemInstruction: `You are FIR Sahayak, an intelligent assistant for helping citizens draft and file FIRs in India. 
      Your goal is to help users describe incidents in simple language and convert them into a structured FIR format.
      You should provide legal guidance and suggestions.
      Current language: ${language}.
      Always respond in the specified language.
      If the user provides enough information, suggest actions like "Download FIR Format" or "Check Missing Information".
      Be empathetic, professional, and clear.`,
    }
  });

  const response = await model;
  return response.text;
}
