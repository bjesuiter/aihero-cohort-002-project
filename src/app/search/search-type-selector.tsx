"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";

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
        <SelectTrigger className="w-[120px] h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="semantic">Semantic</SelectItem>
          <SelectItem value="bm25">BM25</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
