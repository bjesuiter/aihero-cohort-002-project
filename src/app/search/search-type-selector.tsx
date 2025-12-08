"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { BrainIcon, SearchIcon, Sparkles } from "lucide-react";

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
    if (value !== "rrf") {
      params.set("searchType", value);
    }
    router.push(`/search?${params.toString()}`);
  };

  const getIcon = () => {
    if (currentSearchType === "semantic") {
      return <BrainIcon className="h-3.5 w-3.5 text-pink-500 shrink-0" />;
    } else if (currentSearchType === "bm25") {
      return <SearchIcon className="h-3.5 w-3.5 text-blue-500 shrink-0" />;
    } else {
      return <Sparkles className="h-3.5 w-3.5 text-yellow-500 shrink-0" />;
    }
  };

  const getLabel = () => {
    if (currentSearchType === "semantic") {
      return "Semantic";
    } else if (currentSearchType === "bm25") {
      return "BM25";
    } else {
      return "RRF";
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Search type</span>
      <Select value={currentSearchType} onValueChange={handleChange}>
        <SelectTrigger className="w-[140px] h-8">
          <div className="flex items-center gap-1.5">
            {getIcon()}
            <SelectValue>{getLabel()}</SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="rrf">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              <span>RRF</span>
            </div>
          </SelectItem>
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
