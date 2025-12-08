"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ExternalLinkIcon,
  BrainIcon,
  SearchIcon,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Scores = {
  bm25?: number;
  semantic?: number;
  rrf?: number;
};

type ListItem = {
  id: string;
  from: string;
  subject: string;
  preview: string;
  content: string;
  date: string;
  url: string;
  thumbnail: string;
  scores?: Scores;
};

function ListItemCard({ item }: { item: ListItem }) {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  const formatScore = (
    score: number,
    scoreType: "bm25" | "semantic" | "rrf"
  ) => {
    if (scoreType === "semantic" || scoreType === "rrf") {
      // TODO: this percentage stuff seems wrong, so using the raw score for now
      // return `${(score * 100).toFixed(2)}%`;
      return `${score.toFixed(2)}`;
    }
    return score.toFixed(2);
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0">
          <Image
            src={item.thumbnail}
            alt={item.subject}
            width={120}
            height={90}
            className="rounded"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-1">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base mb-0.5">{item.subject}</h3>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">{item.from}</p>
                <Link
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <ExternalLinkIcon className="h-3 w-3" />
                  Watch
                </Link>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDate(item.date)}
              </span>
              {item.scores && (
                <div className="flex flex-col items-end gap-0.5">
                  {item.scores.bm25 !== undefined && (
                    <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                      <SearchIcon className="h-3 w-3 text-blue-500" />
                      BM25: {formatScore(item.scores.bm25, "bm25")}
                    </span>
                  )}
                  {item.scores.semantic !== undefined && (
                    <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                      <BrainIcon className="h-3 w-3 text-pink-500" />
                      Semantic: {formatScore(item.scores.semantic, "semantic")}
                    </span>
                  )}
                  {item.scores.rrf !== undefined && (
                    <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-yellow-500" />
                      RRF: {formatScore(item.scores.rrf, "rrf")}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <p className="text-sm text-foreground/80 mt-2 line-clamp-2">
            {item.preview}
          </p>

          {expanded && (
            <div className="mt-3 pt-3 border-t">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {item.content}
                </pre>
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="mt-2 h-8 text-primary hover:text-primary px-2"
          >
            {expanded ? (
              <>
                <ChevronUpIcon className="h-3.5 w-3.5 mr-1" />
                Show less
              </>
            ) : (
              <>
                <ChevronDownIcon className="h-3.5 w-3.5 mr-1" />
                See more
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function ListUI({ items }: { items: ListItem[] }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <FileIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No items found</h3>
        <p className="text-muted-foreground">Try adjusting your search query</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <ListItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
