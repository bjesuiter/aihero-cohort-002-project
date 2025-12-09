import fs from "node:fs/promises";
import path from "node:path";
import BM25 from "okapibm25";
import { cosineSimilarity, embed, embedMany } from "ai";
import { google } from "@ai-sdk/google";

// Types and Utilities
// -----------------------

interface Video {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  channelTitle: string;
  tags: string[];
  categoryName: string;
  thumbnails: {
    default: {
      url: string;
      width: number;
      height: number;
    };
  };
}

interface VideosData {
  videos: Video[];
}

// Unified scoring interface - each search type populates its relevant score
export interface VideoScores {
  bm25?: number;
  semantic?: number;
  rrf?: number;
}

export interface ScoredVideo {
  video: Video;
  scores: VideoScores;
}

/**
 * Converts a video to its text representation for search/embedding purposes.
 * Ensures consistent formatting across BM25 and embedding generation.
 */
function videoObjectToText(video: Video): string {
  return `Title: ${video.title}
    Description: ${video.description}
    Channel Title: ${video.channelTitle}
    Published At: ${video.publishedAt}
    Tags: ${video.tags.join(", ")}
    Category: ${video.categoryName}
  `;
}

export async function loadVideos(): Promise<Video[]> {
  const filePath = path.join(process.cwd(), "data", "videos.json");
  const fileContent = await fs.readFile(filePath, "utf-8");
  const data: VideosData = JSON.parse(fileContent);
  return data.videos;
}

// Phase 1: BM25 Search
// -----------------------

export const searchWithBM25 = async (
  keywords: string[],
  videos: Video[],
): Promise<ScoredVideo[]> => {
  const corpus = videos.map(videoObjectToText);

  const rawScores: number[] = (BM25 as any)(
    corpus,
    keywords,
  );
  // Map scores to videos with named bm25 score, sort descending
  return rawScores
    .map((score, idx) => ({
      video: videos[idx],
      scores: { bm25: score },
    }))
    .sort((a, b) => (b.scores.bm25 ?? 0) - (a.scores.bm25 ?? 0))
    .filter((video) =>
      video.scores.bm25 !== undefined && video.scores.bm25 > 0.0
    );
};

// Phase 2: Embedding Search
// --------------------------

/**
 * The cache directory for the embeddings.
 * The cache key is the model name.
 * The cache file consists of the cache key and the video id.
 * The content of the cache file is a JSON object with the video id and its embedding.
 * The content of the JSON object is:
 * {
 *   "id": "video id",
 *   "embedding": number[]
 * }
 */
const CACHE_DIR = path.join(process.cwd(), "data", "embeddings");
const CACHE_KEY = "google-text-embedding-004";

/**
 * @param id - The video id.
 * @returns The path to the embedding file.
 */
const getEmbeddingFilePath = (id: string) =>
  path.join(CACHE_DIR, `${CACHE_KEY}-${id}.json`);

/**
 * @param videos - The videos to load or generate embeddings for.
 * @returns An array of objects with the video id and its embedding.
 */
export async function loadOrGenerateEmbeddings(
  videos: Video[],
): Promise<{ id: string; embedding: number[] }[]> {
  // Ensure cache directory exists
  await fs.mkdir(CACHE_DIR, { recursive: true });

  const results: { id: string; embedding: number[] }[] = [];
  const uncachedVideos: Video[] = [];

  // Check cache for each video
  for (const video of videos) {
    try {
      const cached = await fs.readFile(
        getEmbeddingFilePath(video.id),
        "utf-8",
      );
      const data = JSON.parse(cached);
      results.push({ id: video.id, embedding: data.embedding });
    } catch {
      // Cache miss - need to generate
      uncachedVideos.push(video);
    }
  }

  // Generate embeddings for uncached videos in batches of 99
  if (uncachedVideos.length > 0) {
    console.log(
      `Generating embeddings for ${uncachedVideos.length} videos`,
    );
    const BATCH_SIZE = 99;
    for (let i = 0; i < uncachedVideos.length; i += BATCH_SIZE) {
      const batch = uncachedVideos.slice(i, i + BATCH_SIZE);
      console.log(
        `Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${
          Math.ceil(
            uncachedVideos.length / BATCH_SIZE,
          )
        }`,
      );

      // Create text representation for each video (same format as BM25 corpus)
      const texts = batch.map(videoObjectToText);

      const { embeddings } = await embedMany({
        model: google.textEmbeddingModel("text-embedding-004"),
        values: texts,
      });

      // Write batch to cache
      for (let j = 0; j < batch.length; j++) {
        const video = batch[j];
        const embedding = embeddings[j];
        await fs.writeFile(
          getEmbeddingFilePath(video.id),
          JSON.stringify({ id: video.id, embedding }),
        );
        results.push({ id: video.id, embedding });
      }
    }
  }

  return results;
}

export async function searchWithEmbeddings(
  query: string,
  videos: Video[],
): Promise<ScoredVideo[]> {
  // Should load the pre-cached embeddings for the videos
  const embeddings = await loadOrGenerateEmbeddings(videos);

  // generate query embedding
  const { embedding: queryEmbedding } = await embed({
    model: google.textEmbeddingModel("text-embedding-004"),
    value: query,
  });

  const videosWithScores: ScoredVideo[] = embeddings.map(
    ({ id: videoId, embedding }) => {
      const video = videos.find((video) => video.id === videoId)!;
      const score = cosineSimilarity(queryEmbedding, embedding);
      return {
        video,
        scores: { semantic: score },
      };
    },
  );

  // Sort descending and filter by score
  const sortedVideosWithScores = videosWithScores.sort((a, b) =>
    (b.scores.semantic ?? 0) - (a.scores.semantic ?? 0)
  ).filter((video) =>
    video.scores.semantic !== undefined && video.scores.semantic > 0.0
  );

  return sortedVideosWithScores;
}

// Phase 3: Hybrid Search with Reciprocal Rank Fusion
// --------------------------------------------------
// src/app/search.ts
// The RRF_K parameter
// Lower K (e.g., 10): steeper drop-off, top positions matter more.
// Higher K (e.g., 60): gentler drop-off, more positions contribute.
// In your code, RRF_K = 60 gives a balanced weighting across positions.
const RRF_K = 60;
const BM25_THRESHOLD = 0;
const SEMANTIC_THRESHOLD = 0;

// Combines multiple ranking lists using position-based scoring
// Preserves underlying scores from each ranking (bm25, semantic) alongside the RRF score
export function reciprocalRankFusion(
  rankings: ScoredVideo[][],
): ScoredVideo[] {
  const rrfScores = new Map<string, number>();
  const videoMap = new Map<string, Video>();
  const underlyingScores = new Map<string, VideoScores>();

  // Process each ranking list (BM25 and embeddings)
  rankings.forEach((ranking) => {
    // Process each item in the ranking
    ranking.forEach((item, index) => {
      // Skip items with zero/irrelevant scores
      // They shouldn't contribute to the fusion
      const bm25Score = item.scores.bm25;
      const semanticScore = item.scores.semantic;

      // If this ranking has a BM25 score and it's at threshold, skip
      // NOTE: This works, because items sorted by Semantic have a bm25 score of undefined, so this check does not apply
      if (bm25Score !== undefined && bm25Score <= BM25_THRESHOLD) {
        return;
      }
      // If this ranking has a semantic score and it's at threshold, skip
      if (semanticScore !== undefined && semanticScore <= SEMANTIC_THRESHOLD) {
        return;
      }

      // Get the current RRF score for the video
      const currentRrfScore = rrfScores.get(item.video.id) || 0;

      // Position-based scoring: 1/(k+rank)
      const rank = index + 1;
      const contribution = 1 / (RRF_K + rank);
      rrfScores.set(item.video.id, currentRrfScore + contribution);

      // Only set if not already present (video object is identical across rankings)
      if (!videoMap.has(item.video.id)) {
        videoMap.set(item.video.id, item.video);
      }

      // Merge underlying scores from this ranking into the accumulated scores
      const existingScores = underlyingScores.get(item.video.id) || {};
      underlyingScores.set(item.video.id, {
        ...existingScores,
        ...item.scores,
      });
    });
  });

  // Sort by combined RRF score descending
  return Array.from(rrfScores.entries())
    .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
    .map(([videoId, rrfScore]) => ({
      video: videoMap.get(videoId)!,
      scores: {
        ...underlyingScores.get(videoId),
        rrf: rrfScore,
      },
    }));
}

export async function searchWithRRF(
  query: string,
  videos: Video[],
): Promise<ScoredVideo[]> {
  const bm25Ranking = await searchWithBM25(
    query.toLowerCase().split(" "),
    videos,
  );
  const embeddingRanking = await searchWithEmbeddings(query, videos);
  // RRF fusion preserves underlying bm25 and semantic scores, plus adds rrf score
  const rrfRanking = reciprocalRankFusion([bm25Ranking, embeddingRanking]);
  return rrfRanking;
}
