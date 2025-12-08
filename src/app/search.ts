import fs from "node:fs/promises";
import path from "node:path";
import BM25 from "okapibm25";

interface Video {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  channelTitle: string;
  tags: string[];
  categoryName: string;
}

interface VideosData {
  videos: Video[];
}

export const searchWithBM25 = async (
  keywords: string[],
  videos: Video[],
) => {
  const corpus = videos.map((video) =>
    `Title: ${video.title}
    Description: ${video.description}
    Channel Title: ${video.channelTitle}
    Published At: ${video.publishedAt}
    Tags: ${video.tags.join(", ")}
    Category: ${video.categoryName}
  `
  );

  const scores: number[] = (BM25 as any)(
    corpus,
    keywords,
  );
  // Map scores to emails, sort descending
  return scores
    .map((score, idx) => ({ score, video: videos[idx] }))
    .sort((a, b) => b.score - a.score);
};

export async function loadVideos(): Promise<Video[]> {
  const filePath = path.join(process.cwd(), "data", "videos.json");
  const fileContent = await fs.readFile(filePath, "utf-8");
  const data: VideosData = JSON.parse(fileContent);
  return data.videos;
}
