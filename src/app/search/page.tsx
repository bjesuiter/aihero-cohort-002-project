import {
  loadVideos,
  searchWithBM25,
  loadOrGenerateEmbeddings,
  searchWithEmbeddings,
  searchWithRRF,
} from "@/app/search";
import { SideBar } from "@/components/side-bar";
import { TopBar } from "@/components/top-bar";
import { loadChats, loadMemories } from "@/lib/persistence-layer";
import { CHAT_LIMIT } from "../page";
import { ListUI } from "./list-ui";
import { PerPageSelector } from "./per-page-selector";
import { SearchInput } from "./search-input";
import { SearchPagination } from "./search-pagination";
import { SearchTypeSelector } from "./search-type-selector";

export default async function SearchPage(props: {
  searchParams: Promise<{
    q?: string;
    page?: string;
    perPage?: string;
    searchType?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams.q || "";
  const page = Number(searchParams.page) || 1;
  const perPage = Number(searchParams.perPage) || 10;
  const searchType = searchParams.searchType || "rrf"; // "rrf", "bm25", or "semantic"

  // Load video data
  const allVideos = await loadVideos();
  // Pre-cache the embeddings for the videos
  await loadOrGenerateEmbeddings(allVideos);

  // Perform search based on searchType
  let videosWithScores;
  switch (searchType) {
    case "bm25":
      videosWithScores = await searchWithBM25(
        query.toLowerCase().split(" "),
        allVideos
      );
      break;
    case "semantic":
      videosWithScores = await searchWithEmbeddings(query, allVideos);
      break;
    case "rrf":
    default:
      videosWithScores = await searchWithRRF(query, allVideos);
      break;
  }

  // Transform videos to match the expected format
  const transformedVideos = videosWithScores
    .map(({ score, video }) => {
      const scores: { bm25?: number; semantic?: number; rrf?: number } = {};
      if (searchType === "bm25") {
        scores.bm25 = score;
      } else if (searchType === "semantic") {
        scores.semantic = score;
      } else {
        scores.rrf = score;
      }
      return {
        id: video.id,
        from: video.channelTitle,
        subject: video.title,
        preview: video.description.substring(0, 100) + "...",
        content: video.description,
        date: video.publishedAt,
        url: `https://www.youtube.com/watch?v=${video.id}`,
        thumbnail: video.thumbnails.default.url,
        scores,
      };
    })
    .sort((a, b) => {
      // Sort by the score type specified in searchType parameter
      const aScore =
        searchType === "bm25"
          ? (a.scores.bm25 ?? 0)
          : searchType === "semantic"
            ? (a.scores.semantic ?? 0)
            : (a.scores.rrf ?? 0);
      const bScore =
        searchType === "bm25"
          ? (b.scores.bm25 ?? 0)
          : searchType === "semantic"
            ? (b.scores.semantic ?? 0)
            : (b.scores.rrf ?? 0);
      return bScore - aScore;
    });

  const filteredVideos = transformedVideos.filter((video) => {
    // Filter based on any score > 0.0
    return (
      (video.scores.bm25 !== undefined && video.scores.bm25 > 0.0) ||
      (video.scores.semantic !== undefined && video.scores.semantic > 0.0) ||
      (video.scores.rrf !== undefined && video.scores.rrf > 0.0)
    );
  });

  const totalPages = Math.ceil(filteredVideos.length / perPage);
  const startIndex = (page - 1) * perPage;
  const paginatedVideos = filteredVideos.slice(
    startIndex,
    startIndex + perPage
  );
  const allChats = await loadChats();
  const chats = allChats.slice(0, CHAT_LIMIT);
  const memories = await loadMemories();

  return (
    <>
      <SideBar chats={chats} memories={memories} chatIdFromSearchParams={""} />
      <div className="h-screen flex flex-col w-full">
        <TopBar showSidebar={true} title="Data" />
        <div className="flex-1">
          <div className="max-w-4xl mx-auto xl:px-2 px-6 py-6">
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">
                Search through your video archive
              </p>
            </div>

            <div className="flex md:items-center md:justify-between gap-4 flex-col md:flex-row">
              <SearchInput
                initialQuery={query}
                currentPerPage={perPage}
                searchType={searchType}
              />
              <div className="flex items-center gap-4">
                <SearchTypeSelector
                  currentSearchType={searchType}
                  query={query}
                  perPage={perPage}
                />
                <PerPageSelector
                  currentPerPage={perPage}
                  query={query}
                  searchType={searchType}
                />
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">
                  {query ? (
                    <>
                      Found {filteredVideos.length} result
                      {filteredVideos.length !== 1 ? "s" : ""} for &ldquo;
                      {query}
                      &rdquo;
                    </>
                  ) : (
                    <>Found {filteredVideos.length} videos</>
                  )}
                </p>
              </div>
              <ListUI items={paginatedVideos} />
              {totalPages > 1 && (
                <div className="mt-6">
                  <SearchPagination
                    currentPage={page}
                    totalPages={totalPages}
                    query={query}
                    perPage={perPage}
                    searchType={searchType}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
