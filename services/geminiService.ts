
import { GoogleGenAI, Chat, Content } from "@google/genai";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const chatModel = ai.chats;

export const createChatSession = (history?: Content[]): Chat => {
  return chatModel.create({
    model: 'gemini-2.5-flash',
    config: {
        systemInstruction: 'You are a helpful and friendly AI assistant. Your responses should be informative, well-structured, and easy to understand. When asked for code, provide it in a clean markdown format.',
    },
    history: history,
  });
};

export const generateImagesFromPrompt = async (prompt: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: prompt,
        config: {
          numberOfImages: 2,
          outputMimeType: 'image/jpeg',
          aspectRatio: '1:1',
        },
    });
    return response.generatedImages.map(img => img.image.imageBytes);
  } catch (error: unknown) {
    console.error("Image generation failed:", error);
    
    let finalMessage = "Failed to generate images. The model may have refused the prompt.";
    
    const apiError = error as { error?: { status?: string, message?: string } };

    if (apiError?.error?.status === 'RESOURCE_EXHAUSTED') {
      finalMessage = "You've exceeded your API quota. Please check your plan and billing details.";
    } else if (apiError?.error?.message) {
      finalMessage = apiError.error.message;
    } else if (error instanceof Error) {
      finalMessage = error.message;
    }
    
    throw new Error(finalMessage);
  }
};