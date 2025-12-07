import { createOpenAI } from "@ai-sdk/openai";

const opencodeZenApiEndpoint = process.env.OPENCODE_ZEN_API_ENDPOINT;
if (!opencodeZenApiEndpoint) {
    throw new Error("OPENCODE_ZEN_API_ENDPOINT is not set");
}

const zenApiKey = process.env.OPENCODE_ZEN_API_KEY;
if (!zenApiKey) {
    throw new Error("OPENCODE_ZEN_API_KEY is not set");
}

// Available Models:
// see: https://opencode.ai/docs/zen/#endpoints
// GPT 5.1	gpt-5.1	https://opencode.ai/zen/v1/responses	@ai-sdk/openai
// GPT 5.1 Codex	gpt-5.1-codex	https://opencode.ai/zen/v1/responses	@ai-sdk/openai
// GPT 5.1 Codex Max	gpt-5.1-codex-max	https://opencode.ai/zen/v1/responses	@ai-sdk/openai
// GPT 5	gpt-5	https://opencode.ai/zen/v1/responses	@ai-sdk/openai
// GPT 5 Codex	gpt-5-codex	https://opencode.ai/zen/v1/responses	@ai-sdk/openai
// GPT 5 Nano	gpt-5-nano	https://opencode.ai/zen/v1/responses	@ai-sdk/openai
export const zenOpenai = createOpenAI({
    baseURL: opencodeZenApiEndpoint,
    apiKey: zenApiKey,
    name: "opencode-zen-openai",
});
