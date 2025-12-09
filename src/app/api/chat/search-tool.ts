import {
    loadVideos,
    reciprocalRankFusion,
    searchWithBM25,
    searchWithEmbeddings,
    searchWithRRF,
} from "@/app/search";
import { tool } from "ai";
import { z } from "zod";

// For keyword system prompt:
// Always include a lowercase version of a keyword together with the keyword itself, except if the keyword is a number.
//                 Example: "1000" should be searched as "1000" and "1000".

export const searchTool = tool({
    name: "search",
    description:
        "Search for videos in my 'Watch later' Playlist by BM25 and semantic search. Returns most relevant videos ranked by reciprocal rank fusion.",
    inputSchema: z.object({
        keywords: z.array(z.string())
            .describe(
                `Exact keywords to search for with BM25 (names, ammounts, specific terms).`,
            )
            .optional(),
        query: z.string().describe(
            "Natural language query for semantic search (broader concepts)",
        ).optional(),
    }),
    execute: async ({ keywords, query }) => {
        const videos = await loadVideos();

        // TODO: we need some query rewriting & search improvements to produce better results.
        // For example: i should higher-rank videos that are more recent.
        console.log("Keywords: ", keywords);
        console.log("SearchQuery:", query);

        const bm25Videos = keywords
            ? await searchWithBM25(keywords, videos)
            : [];
        const semanticVideos = query
            ? await searchWithEmbeddings(query, videos)
            : [];
        const rrfVideos = reciprocalRankFusion([
            bm25Videos.slice(0, 30),
            semanticVideos.slice(0, 30),
        ]);

        const topVideos = rrfVideos.slice(0, 10); // map here if needed
        // .map((scoredVideo) => ({})
        return {
            videos: topVideos,
        };
    },
});
