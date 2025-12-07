import { createGoogleGenerativeAI } from "@ai-sdk/google";

const opencodeZenApiEndpoint = process.env.OPENCODE_ZEN_API_ENDPOINT;
if (!opencodeZenApiEndpoint) {
    throw new Error("OPENCODE_ZEN_API_ENDPOINT is not set");
}

const zenApiKey = process.env.OPENCODE_ZEN_API_KEY;
if (!zenApiKey) {
    throw new Error("OPENCODE_ZEN_API_KEY is not set");
}

// TODO: Not working right now, probably hanging on googles side

// Available Models:
// see: https://opencode.ai/docs/zen/#endpoints
// - gemini-3-pro
export const zenGoogle = createGoogleGenerativeAI({
    baseURL: opencodeZenApiEndpoint,
    apiKey: zenApiKey,
    name: "opencode-zen-google",
});
