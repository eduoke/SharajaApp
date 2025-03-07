import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export async function getJournalInsights(content: string) {
  try {
    // Using BERT-based model for sentiment analysis and text classification
    const response = await hf.textClassification({
      model: "SamLowe/roberta-base-go_emotions",
      inputs: content,
    });

    // Format response to match our existing structure
    const mood = response[0]?.label || "neutral";

    // Get text summarization for insights
    const insightResponse = await hf.summarization({
      model: "facebook/bart-large-cnn",
      inputs: content,
      parameters: {
        max_length: 100,
        min_length: 30,
      },
    });

    // Split summary into meaningful insights
    const insights = insightResponse.summary_text
      .split(".")
      .filter(Boolean)
      .map(s => s.trim());

    return {
      mood,
      insights,
      suggestions: [
        "Consider expanding on your thoughts",
        "Try writing about related experiences",
        "Reflect on how this connects to your goals"
      ]
    };
  } catch (error: any) {
    throw new Error(`Failed to get journal insights: ${error.message}`);
  }
}

export async function getJournalRecommendations(previousEntries: string[]) {
  try {
    // Combine previous entries for context
    const context = previousEntries.join(" ");

    // Use text generation to create writing prompts
    const response = await hf.textGeneration({
      model: "gpt2",
      inputs: `Based on these journal entries, suggest writing topics:\n${context}\nTopics:`,
      parameters: {
        max_new_tokens: 100,
        return_full_text: false,
      }
    });

    // Parse generated text into topics and prompts
    const suggestions = response.generated_text
      .split("\n")
      .filter(Boolean)
      .map(s => s.trim());

    return {
      topics: suggestions.slice(0, 3),
      prompts: [
        "What emotions came up for you today?",
        "Describe a moment that challenged you",
        "What are you looking forward to?"
      ]
    };
  } catch (error: any) {
    throw new Error(`Failed to get recommendations: ${error.message}`);
  }
}