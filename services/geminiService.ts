
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { CrosswordResponse } from '../types';
import { GEMINI_MODEL_NAME, CROSSWORD_PROMPT_HEADER } from '../constants';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY environment variable is not set.");
  // In a real app, you might throw an error or handle this more gracefully
  // For this exercise, we'll let it proceed and fail at API call time if key is truly missing.
}

const ai = new GoogleGenAI({ apiKey: API_KEY! }); // Non-null assertion, assuming it's set.

export const fetchCrosswordData = async (): Promise<CrosswordResponse> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: CROSSWORD_PROMPT_HEADER,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7, // Add some creativity
      },
    });

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }

    const parsedData = JSON.parse(jsonStr) as CrosswordResponse;

    if (!parsedData.gridSize || !parsedData.words || !Array.isArray(parsedData.words)) {
      throw new Error("Invalid crossword data structure from API. Missing gridSize or words array.");
    }
    if (parsedData.words.some(word => !word.word || !word.clue || !word.direction || word.startRow === undefined || word.startCol === undefined)) {
        throw new Error("Invalid crossword data: one or more words are missing required fields.");
    }


    return parsedData;
  } catch (error) {
    console.error("Error fetching or parsing crossword data:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate crossword: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating the crossword.");
  }
};
