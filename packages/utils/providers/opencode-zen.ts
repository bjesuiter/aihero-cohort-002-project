import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const opencodeZenApiEndpoint = process.env.OPENCODE_ZEN_API_ENDPOINT;
if (!opencodeZenApiEndpoint) {
    throw new Error("OPENCODE_ZEN_API_ENDPOINT is not set");
}

const zenApiKey = process.env.OPENCODE_ZEN_API_KEY;
if (!zenApiKey) {
    throw new Error("OPENCODE_ZEN_API_KEY is not set");
}

export const opencodeZen = createOpenAICompatible({
    baseURL: opencodeZenApiEndpoint,
    apiKey: zenApiKey,
    name: "opencode-zen",
});
