"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type QuickSearchItem = {
  label: string;
  value: string;
  categorySlug: string;
  aliases: string[];
};

// ✅ DB slug এর সাথে 100% match করানো হয়েছে
const QUICK_SEARCHES: QuickSearchItem[] = [
  {
    label: "স্মার্টফোন",
    value: "smartphone",
    categorySlug: "smartphones",
    aliases: [
      "স্মার্টফোন",
      "মোবাইল",
      "ফোন",
      "mobile",
      "phone",
      "smartphones",
    ],
  },
  {
    label: "স্মার্টওয়াচ",
    value: "smartwatch",
    categorySlug: "smartwatches",
    aliases: [
      "স্মার্টওয়াচ",
      "ঘড়ি",
      "watch",
      "smart watch",
      "smartwatches",
      "wearable",
    ],
  },
  {
    label: "হেডফোন ও অডিও",
    value: "headphone",
    categorySlug: "audio",
    aliases: [
      "হেডফোন",
      "ইয়ারফোন",
      "অডিও",
      "নেকব্যান্ড",
      "earphone",
      "earbuds",
      "headphone",
      "neckband",
      "audio",
      "bluetooth earphone",
    ],
  },
  {
    label: "ল্যাপটপ ও ট্যাব",
    value: "laptop",
    categorySlug: "laptops-tabs",
    aliases: [
      "ল্যাপটপ",
      "ট্যাব",
      "ট্যাবলেট",
      "laptop",
      "tab",
      "tablet",
      "notebook",
      "macbook",
      "ipad",
    ],
  },
  {
    label: "পাওয়ার ও অ্যাক্সেসরিজ",
    value: "accessories",
    categorySlug: "power-accessories",
    aliases: [
      "অ্যাক্সেসরিজ",
      "পাওয়ারব্যাংক",
      "চার্জার",
      "ক্যাবল",
      "ইউপিএস",
      "accessories",
      "powerbank",
      "charger",
      "cable",
      "ups",
      "mini ups",
      "usb light",
      "flashlight",
    ],
  },
  {
    label: "কিচেন ও হোম",
    value: "home appliance",
    categorySlug: "kitchen-home",
    aliases: [
      "কিচেন",
      "হোম",
      "অ্যাপ্লায়েন্স",
      "kitchen",
      "home",
      "appliance",
      "purifier",
    ],
  },
  {
    label: "ফ্যান ও কুলিং",
    value: "fan",
    categorySlug: "fan-cooling",
    aliases: [
      "ফ্যান",
      "কুলিং",
      "টেবিল ফ্যান",
      "fan",
      "cooling",
      "table fan",
      "mini fan",
      "handheld fan",
      "portable fan",
    ],
  },
];

// সব alias একটা flat map এ — O(1) lookup
const ALIAS_MAP = QUICK_SEARCHES.reduce<Record<string, QuickSearchItem>>(
  (acc, item) => {
    const keys = [item.label, item.value, ...item.aliases];
    keys.forEach((key) => {
      acc[key.trim().toLowerCase()] = item;
    });
    return acc;
  },
  {},
);

const normalizeText = (text: string) => text.trim().replace(/\s+/g, " ");

const findQuickSearch = (raw: string): QuickSearchItem | undefined => {
  const key = normalizeText(raw).toLowerCase();

  // exact match
  if (ALIAS_MAP[key]) return ALIAS_MAP[key];

  // partial match — user "neckband" লিখলে "audio" category পাবে
  for (const aliasKey in ALIAS_MAP) {
    if (key.includes(aliasKey) || aliasKey.includes(key)) {
      return ALIAS_MAP[aliasKey];
    }
  }

  return undefined;
};

const buildSearchUrl = (query: string) =>
  `/products?search=${encodeURIComponent(query)}`;

const buildQuickSearchUrl = (item: QuickSearchItem) => {
  const params = new URLSearchParams();
  params.set("search", item.value);
  params.set("category", item.categorySlug);
  return `/products?${params.toString()}`;
};

interface SearchDropdownProps {
  onClose: () => void;
}

export default function SearchDropdown({ onClose }: SearchDropdownProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // auto focus
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Escape key close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const navigateByQuery = (raw: string) => {
    const cleaned = normalizeText(raw);
    if (!cleaned) return;

    const matched = findQuickSearch(cleaned);
    if (matched) {
      router.push(buildQuickSearchUrl(matched));
    } else {
      router.push(buildSearchUrl(cleaned));
    }
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigateByQuery(query);
  };

  const handleQuickSearch = (item: QuickSearchItem) => {
    router.push(buildQuickSearchUrl(item));
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 top-12 z-1 bg-black/40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative z-2 border-b border-border/40 bg-popover/95 shadow-2xl animate-in slide-in-from-top-2 duration-200"
        style={{ backdropFilter: "blur(30px) saturate(180%)" }}
      >
        <div className="container mx-auto px-4 py-3">
          <form onSubmit={handleSubmit} role="search">
            <div className="relative flex items-center">
              <Search
                className={`absolute left-3 size-4 transition-colors ${
                  focused ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <Input
                ref={inputRef}
                type="search"
                placeholder="প্রোডাক্ট খুঁজুন... (বাংলা বা English)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                className="h-10 pl-10 pr-10 rounded-full border-none bg-accent/30 focus-visible:ring-primary/20"
                autoComplete="off"
                spellCheck={false}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 h-8 w-8 rounded-full hover:text-destructive"
                onClick={onClose}
                aria-label="Close search"
              >
                <X className="size-4" />
              </Button>
            </div>
          </form>

          {/* Quick Search Chips */}
          <div className="flex items-center gap-2 flex-wrap mt-3 pb-1">
            <TrendingUp className="size-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground">জনপ্রিয়:</span>
            {QUICK_SEARCHES.map((item) => (
              <button
                key={item.categorySlug}
                type="button"
                onClick={() => handleQuickSearch(item)}
                className="text-xs px-3 py-1.5 rounded-xl bg-secondary/60 hover:bg-primary hover:text-primary-foreground border border-border/40 hover:border-primary transition-all duration-200"
                aria-label={`${item.label} খুঁজুন`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}