import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function getJournalInsights(content: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an empathetic journal assistant. Analyze the journal entry and provide insights, suggestions, and mood analysis. Return the response in JSON format with the following structure: { mood: string, insights: string[], suggestions: string[] }"
        },
        {
          role: "user",
          content
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error: any) {
    throw new Error(`Failed to get journal insights: ${error.message}`);
  }
}

export async function getJournalRecommendations(previousEntries: string[]) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Based on the user's previous journal entries, suggest topics or prompts for their next entry. Return response as JSON with format: { topics: string[], prompts: string[] }"
        },
        {
          role: "user",
          content: JSON.stringify(previousEntries)
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error: any) {
    throw new Error(`Failed to get recommendations: ${error.message}`);
  }
}
