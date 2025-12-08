import { TopBar } from "@/components/top-bar";
import { SearchInput } from "./search-input";
import { EmailList } from "./email-list";
import { SearchPagination } from "./search-pagination";
import { PerPageSelector } from "./per-page-selector";
import fs from "fs/promises";
import path from "path";
import { loadChats, loadMemories } from "@/lib/persistence-layer";
import { CHAT_LIMIT } from "../page";
import { SideBar } from "@/components/side-bar";

interface Video {
  id: string;
  title: string;
  description: string;
  url: string;
}

interface VideosData {
  videos: Video[];
}

async function loadVideos(): Promise<Video[]> {
  const filePath = path.join(process.cwd(), "data", "videos.json");
  const fileContent = await fs.readFile(filePath, "utf-8");
  const data: VideosData = JSON.parse(fileContent);
  return data.videos;
}

export default async function SearchPage(props: {
  searchParams: Promise<{ q?: string; page?: string; perPage?: string }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams.q || "";
  const page = Number(searchParams.page) || 1;
  const perPage = Number(searchParams.perPage) || 10;

  const allVideos = await loadVideos();

  // Extract domain from URL for "from" field
  const getDomainFromUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace("www.", "");
    } catch {
      return "Unknown";
    }
  };

  // Transform videos to match the expected format
  const transformedVideos = allVideos.map((video) => ({
    id: video.id,
    from: getDomainFromUrl(video.url),
    subject: video.title,
    preview: video.description.substring(0, 100) + "...",
    content: video.description,
    date: new Date().toISOString(), // Videos don't have timestamps, using current date
  }));

  // Filter videos based on search query
  const filteredVideos = query
    ? transformedVideos.filter(
        (video) =>
          video.subject.toLowerCase().includes(query.toLowerCase()) ||
          video.from.toLowerCase().includes(query.toLowerCase()) ||
          video.content.toLowerCase().includes(query.toLowerCase())
      )
    : transformedVideos;

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
              <EmailList emails={paginatedVideos} />
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
