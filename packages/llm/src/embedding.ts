import { getOpenAI } from "./client";

export async function embedText(text: string, opts: { model?: string } = {}): Promise<number[]> {
  const model = opts.model ?? process.env.EMBEDDING_MODEL ?? "text-embedding-3-small";
  const response = await getOpenAI().embeddings.create({
    model,
    input: text.slice(0, 8000),
  });
  return response.data[0].embedding;
}
