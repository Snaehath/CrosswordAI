
export const GEMINI_MODEL_NAME = "gemini-2.0-flash";
export const CROSSWORD_PROMPT_HEADER = `Generate a crossword puzzle based on general knowledge. Include a variety of topics such as history, science, literature, geography, sports, and pop culture.

Requirements:
1. Choose an appropriate grid size between 10 and 20 rows and columns.
2. Fill the grid with intersecting words related to general knowledge.
3. All words must:
   - Use only uppercase English letters (A–Z)
   - Fit entirely within the grid
   - Be labeled with "ACROSS" or "DOWN"
   - Include valid starting row and column positions (0-indexed)
   - Intersect correctly with other words where appropriate

Return only a valid JSON object in the following format:
{
  "theme": "GENERAL KNOWLEDGE",
  "gridSize": { "rows": number, "cols": number },
  "words": [
    {
      "word": "STRING",
      "clue": "Clue for the word",
      "direction": "ACROSS" | "DOWN",
      "startRow": number,
      "startCol": number
    }
  ]
}

Do not include any extra text or formatting. Return the JSON object only.
Ensure all words are unique and clues are distinct.
The grid should be reasonably dense with words.
Make sure the startRow and startCol are 0-indexed and within the gridSize.
Words must intersect correctly. A 15x15 grid is a good target if possible.
`;
