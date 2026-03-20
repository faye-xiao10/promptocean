import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

export type AIResponse = {
  content: string;
  model: string;
  tokensUsed?: number;
};

// ---------------------------------------------------------------------------
// Claude (Anthropic)
// ---------------------------------------------------------------------------

export async function callClaude(
  systemPrompt: string,
  userMessage: string
): Promise<AIResponse> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const content = textBlock?.type === 'text' ? textBlock.text : '';

    return {
      content,
      model: response.model,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
    };
  } catch (err) {
    throw new Error(`Claude error: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

// ---------------------------------------------------------------------------
// GPT (OpenAI)
// ---------------------------------------------------------------------------

export async function callGPT(
  systemPrompt: string,
  userMessage: string
): Promise<AIResponse> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    });

    return {
      content: response.choices[0].message.content ?? '',
      model: response.model,
      tokensUsed: response.usage?.total_tokens,
    };
  } catch (err) {
    throw new Error(`GPT error: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

// ---------------------------------------------------------------------------
// Gemini (Google)
// ---------------------------------------------------------------------------

export async function callGemini(
  systemPrompt: string,
  userMessage: string
): Promise<AIResponse> {
  const client = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

  try {
    const model = client.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      generationConfig: { maxOutputTokens: 1024 },
    });

    return {
      content: result.response.text(),
      model: 'gemini-2.5-flash',
      tokensUsed: result.response.usageMetadata?.totalTokenCount,
    };
  } catch (err) {
    throw new Error(`Gemini error: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}
