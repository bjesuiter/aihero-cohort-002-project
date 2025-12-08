"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { BrainIcon, SearchIcon } from "lucide-react";

export function SearchTypeSelector({
  currentSearchType,
  query,
  perPage,
}: {
  currentSearchType: string;
  query: string;
  perPage: number;
}) {
  const router = useRouter();

  const handleChange = (value: string) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (perPage !== 10) params.set("perPage", perPage.toString());
    // Reset to page 1 when changing search type
    params.set("page", "1");
    if (value !== "semantic") {
      params.set("searchType", value);
    }
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Search type</span>
      <Select value={currentSearchType} onValueChange={handleChange}>
        <SelectTrigger className="w-[140px] h-8">
          <div className="flex items-center gap-1.5">
            {currentSearchType === "semantic" ? (
              <BrainIcon className="h-3.5 w-3.5 text-pink-500 shrink-0" />
            ) : (
              <SearchIcon className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            )}
            <SelectValue>
              {currentSearchType === "semantic" ? "Semantic" : "BM25"}
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="semantic">
            <div className="flex items-center gap-2">
              <BrainIcon className="h-4 w-4 text-pink-500" />
              <span>Semantic</span>
            </div>
          </SelectItem>
          <SelectItem value="bm25">
            <div className="flex items-center gap-2">
              <SearchIcon className="h-4 w-4 text-blue-500" />
              <span>BM25</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
