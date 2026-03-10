"use client";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, CornerDownLeft, X, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { tools } from "@/data/tools";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { SVGIcon } from "@/components/common/svg-icon";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [mounted, setMounted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();

  // Mount safety
  useEffect(() => {
    setMounted(true);
  }, []);

  // Flatten tools once – very cheap operation
  const allItems = useMemo(
    () =>
      tools.flatMap((cat) =>
        cat.items.map((item) => ({ ...item, category: cat.category })),
      ),
    [], // ← empty deps = compute only once
  );

  const filteredItems = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allItems
      .filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [query, allItems]);

  const handleSelect = useCallback(
    (url: string) => {
      router.push(url);
      setIsOpen(false);
      setQuery("");
      inputRef.current?.blur();
    },
    [router],
  );

  // Close on route change
  useEffect(() => {
    setIsOpen(false);
    setQuery("");
    inputRef.current?.blur();
  }, [pathname]);

  // Keep open on mobile while input is focused
  useEffect(() => {
    if (!isMobile) return;

    const input = inputRef.current;
    if (!input) return;

    const onFocus = () => setIsOpen(true);
    const onBlur = (e: FocusEvent) => {
      // Only close if focus did NOT move inside our container
      if (
        containerRef.current &&
        !containerRef.current.contains(e.relatedTarget as Node)
      ) {
        setIsOpen(false);
        setQuery("");
      }
    };

    input.addEventListener("focus", onFocus);
    input.addEventListener("blur", onBlur);

    return () => {
      input.removeEventListener("focus", onFocus);
      input.removeEventListener("blur", onBlur);
    };
  }, [isMobile]);

  // Keyboard + click outside logic
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setQuery("");
        inputRef.current?.blur();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Global shortcut: Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
        return;
      }

      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
        inputRef.current?.blur();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < filteredItems.length - 1 ? prev + 1 : prev,
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredItems.length > 0) {
          const idx = activeIndex >= 0 ? activeIndex : 0;
          handleSelect(filteredItems[idx].url);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    // Only register click-outside when open (desktop mostly)
    if (isOpen && !isMobile) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, isMobile, filteredItems, activeIndex, handleSelect]);

  // Reset active index on query change
  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  // Mobile: body scroll lock + auto-focus
  useEffect(() => {
    if (!isMobile || !isOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    inputRef.current?.focus();

    // Fallback: very short delay only if needed (test!)
    // const timer = setTimeout(() => inputRef.current?.focus(), 150);

    return () => {
      // clearTimeout(timer);
      document.body.style.overflow = "";
    };
  }, [isMobile, isOpen]);

  // Mobile collapsed state (only icon)
  if (mounted && isMobile && !isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true);
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }}
        className="p-2 rounded-full hover:bg-muted transition-colors ml-auto"
        aria-label="Search tools"
      >
        <Search className="h-5 w-5 text-muted-foreground" />
      </button>
    );
  }

  if (!mounted) return null;

  const showSuggestions = filteredItems.length > 0;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative transition-all duration-300",
        isMobile && isOpen
          ? "fixed inset-0 z-50 p-4 bg-background h-screen flex flex-col animate-in fade-in slide-in-from-top-4 duration-200"
          : "w-full max-w-sm lg:max-w-md",
      )}
      onClick={(e) => {
        if (isMobile && isOpen && e.target === e.currentTarget) {
          setIsOpen(false);
        }
      }}
    >
      {/* Desktop-only subtle backdrop */}
      {!isMobile && isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-background/20 backdrop-blur-[2px] z-[-1]"
        />
      )}

      <div className="w-full h-full flex flex-col">
        {/* Input row */}
        <div className="relative group flex items-center gap-2">
          {isMobile && isOpen && (
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-muted rounded-full transition-colors shrink-0"
            >
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </button>
          )}

          <div className="relative flex-1">
            <Search className="absolute left-3 md:left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />

            <Input
              ref={inputRef}
              placeholder="Search tools..."
              className={cn(
                "pl-10 h-11 sm:h-10 bg-muted/40 md:bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary/20 md:focus-visible:ring-transparent shadow-none transition-all rounded md:rounded-none",
              )}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true); // ensure open on typing
              }}
              onFocus={() => setIsOpen(true)}
            />

            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {query && (
                <button
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  className="p-1 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}

              {!isMobile && (
                <div className="hidden sm:flex items-center gap-1 text-[10px] font-medium text-muted-foreground select-none pointer-events-none opacity-50 group-focus-within:opacity-100 transition-opacity">
                  <kbd className="px-1.5 py-0.5 rounded border bg-background">
                    ⌘
                  </kbd>
                  <kbd className="px-1.5 py-0.5 rounded border bg-background">
                    K
                  </kbd>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Suggestions / mobile list */}
        {showSuggestions && (
          <div
            className={cn(
              "bg-popover border shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200",
              isMobile
                ? "relative h-full mt-4 border-none shadow-none bg-transparent flex-1 overflow-y-auto"
                : "absolute top-[calc(100%+4px)] w-full rounded min-w-xs",
            )}
          >
            <div className="p-2">
              <div className="space-y-0.5">
                {filteredItems.map((item, index) => (
                  <button
                    key={item.url}
                    onClick={() => handleSelect(item.url)}
                    onMouseEnter={() => !isMobile && setActiveIndex(index)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-3 sm:py-2 rounded text-sm transition-colors text-left",
                      activeIndex === index
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50",
                    )}
                  >
                    <div
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        activeIndex === index
                          ? "bg-background shadow-sm text-primary"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <SVGIcon
                        src={item.icon}
                        className="h-4 min-w-4 transition-all flex items-center justify-center"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{item.title}</div>
                      <div className="text-[11px] truncate opacity-80">
                        {item.description}
                      </div>
                    </div>

                    {!isMobile && activeIndex === index ? (
                      <CornerDownLeft className="h-3.5 w-3.5 text-background/50 dark:text-muted-foreground/80 animate-in slide-in-from-right-2" />
                    ) : (
                      <span className="text-[10px] text-muted-foreground font-medium px-1.5">
                        {item.category}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {!isMobile && (
              <div className="bg-muted/30 p-2.5 border-t flex justify-between items-center text-[10px] text-muted-foreground px-4">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-1 rounded border bg-background">↑↓</kbd>{" "}
                    navigate
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-1 rounded border bg-background">↵</kbd>{" "}
                    select
                  </span>
                </div>
                <div className="font-medium opacity-50">
                  {filteredItems.length} results
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mobile no-results placeholder */}
        {isMobile && !showSuggestions && query.trim() !== "" && (
          <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground gap-2 opacity-60">
            <Search className="h-10 w-10 mb-2" />
            <p className="text-sm font-medium">No tools found for "{query}"</p>
          </div>
        )}
      </div>
    </div>
  );
}
