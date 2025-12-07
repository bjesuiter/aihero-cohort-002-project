import { createAnthropic } from "@ai-sdk/anthropic";

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
// Claude Sonnet 4.5	claude-sonnet-4-5	https://opencode.ai/zen/v1/messages	@ai-sdk/anthropic
// Claude Sonnet 4	claude-sonnet-4	https://opencode.ai/zen/v1/messages	@ai-sdk/anthropic
// Claude Haiku 4.5	claude-haiku-4-5	https://opencode.ai/zen/v1/messages	@ai-sdk/anthropic
// Claude Opus 4.5	claude-opus-4-5	https://opencode.ai/zen/v1/messages	@ai-sdk/anthropic
// Claude Opus 4.1	claude-opus-4-1	https://opencode.ai/zen/v1/messages	@ai-sdk/anthropic
// Wrong in the docs, not supported:
// Claude Haiku 3.5	claude-3-5-haiku	https://opencode.ai/zen/v1/messages	@ai-sdk/anthropic
export const zenAnthropic = createAnthropic({
    baseURL: opencodeZenApiEndpoint,
    apiKey: zenApiKey,
    name: "opencode-zen-anthropic",
});
