import { loadVideos, searchWithBM25 } from "@/app/search";
import { SideBar } from "@/components/side-bar";
import { TopBar } from "@/components/top-bar";
import { loadChats, loadMemories } from "@/lib/persistence-layer";
import { CHAT_LIMIT } from "../page";
import { ListUI } from "./list-ui";
import { PerPageSelector } from "./per-page-selector";
import { SearchInput } from "./search-input";
import { SearchPagination } from "./search-pagination";

export default async function SearchPage(props: {
  searchParams: Promise<{ q?: string; page?: string; perPage?: string }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams.q || "";
  const page = Number(searchParams.page) || 1;
  const perPage = Number(searchParams.perPage) || 10;

  const allVideos = await loadVideos();

  const videosWithScores = await searchWithBM25(
    query.toLowerCase().split(" "),
    allVideos
  );

  // Transform videos to match the expected format
  const transformedVideos = videosWithScores
    .map(({ score, video }) => ({
      id: video.id,
      from: video.channelTitle,
      subject: video.title,
      preview: video.description.substring(0, 100) + "...",
      content: video.description,
      date: video.publishedAt,
      url: `https://www.youtube.com/watch?v=${video.id}`,
      thumbnail: video.thumbnails.default.url,
      score,
    }))
    .sort((a, b) => b.score - a.score);

  const filteredVideos = transformedVideos.filter((video) => video.score > 0.0);

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
              <SearchInput initialQuery={query} currentPerPage={perPage} />
              <PerPageSelector currentPerPage={perPage} query={query} />
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
              <ListUI emails={paginatedVideos} />
              {totalPages > 1 && (
                <div className="mt-6">
                  <SearchPagination
                    currentPage={page}
                    totalPages={totalPages}
                    query={query}
                    perPage={perPage}
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
