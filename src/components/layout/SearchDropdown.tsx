// src/components/layout/SearchDropdown.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const TRENDING = [
  "স্মার্টফোন",
  "ল্যাপটপ",
  "হেডফোন",
  "স্মার্টওয়াচ",
  "ক্যামেরা",
];

interface SearchDropdownProps {
  onClose: () => void;
}

export default function SearchDropdown({ onClose }: SearchDropdownProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?search=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  const handleTrending = (term: string) => {
    router.push(`/search?search=${encodeURIComponent(term)}`);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 top-12 z-50 bg-black/40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="absolute top-full left-0 right-0 z-50 border-b border-border/40 bg-popover/95 shadow-2xl animate-in slide-in-from-top-2 duration-200"
        style={{ backdropFilter: "blur(30px) saturate(180%)" }}
      >
        <div className="container mx-auto px-4 py-3">
          <form onSubmit={handleSubmit} role="search">
            <div className="relative flex items-center">
              <Search
                className={`absolute left-3 size-4 transition-colors ${focused ? "text-primary" : "text-muted-foreground"}`}
              />
              <Input
                ref={inputRef}
                type="search"
                placeholder="প্রোডাক্ট খুঁজুন..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                className="h-10 pl-10 pr-10 rounded-full border-none bg-accent/30 focus-visible:ring-primary/20"
                autoComplete="off"
                spellCheck="false"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 h-8 w-8 rounded-full hover:text-destructive"
                onClick={onClose}
              >
                <X className="size-4" />
              </Button>
            </div>
          </form>

          {/* Trending */}
          <div className="flex items-center gap-2 flex-wrap mt-3 pb-1">
            <TrendingUp className="size-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground">জনপ্রিয়:</span>
            {TRENDING.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => handleTrending(term)}
                className="text-xs px-3 py-1.5 rounded-xl bg-secondary/60 hover:bg-primary hover:text-primary-foreground border border-border/40 hover:border-primary transition-all duration-200"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
