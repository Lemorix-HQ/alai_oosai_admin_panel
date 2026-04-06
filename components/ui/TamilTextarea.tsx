"use client";

import { useState, useRef, useEffect } from "react";

interface TamilTextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  tamilMode: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

function extractCurrentWord(
  text: string,
  cursorPos: number
): { word: string; start: number } {
  let start = cursorPos;
  while (start > 0 && !/[\s,]/.test(text[start - 1])) {
    start--;
  }
  return { word: text.slice(start, cursorPos), start };
}

async function fetchSuggestions(word: string): Promise<string[]> {
  if (!word || !/[a-zA-Z]/.test(word)) return [];
  try {
    const res = await fetch(
      `/api/transliterate?text=${encodeURIComponent(word)}`
    );
    const data = await res.json();
    if (data[0] === "SUCCESS" && Array.isArray(data[1]?.[0]?.[1])) {
      return data[1][0][1] as string[];
    }
    return [];
  } catch {
    return [];
  }
}

export default function TamilTextarea({
  tamilMode,
  value,
  onChange,
  onBlur,
  onKeyDown,
  ...props
}: TamilTextareaProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wordStartRef = useRef(0);
  const cursorPosRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tamilMode) {
      setSuggestions([]);
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  }, [tamilMode]);

  // Reset active index when suggestions change
  useEffect(() => {
    setActiveIndex(-1);
  }, [suggestions]);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex] as HTMLElement;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    onChange(e);
    if (!tamilMode) return;

    const text = e.target.value;
    const cursorPos = e.target.selectionStart ?? text.length;
    cursorPosRef.current = cursorPos;

    const { word, start } = extractCurrentWord(text, cursorPos);
    wordStartRef.current = start;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const results = await fetchSuggestions(word);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    }, 300);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault();
        selectSuggestion(suggestions[activeIndex]);
        return;
      }
    }
    if (e.key === "Escape" || e.key === " ") {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
    onKeyDown?.(e);
  }

  function selectSuggestion(suggestion: string) {
    const before = value.slice(0, wordStartRef.current);
    const after = value.slice(cursorPosRef.current);
    const newValue = before + suggestion + " " + after;

    onChange({
      target: { name: props.name || "", value: newValue },
    } as React.ChangeEvent<HTMLTextAreaElement>);

    setSuggestions([]);
    setShowSuggestions(false);
    setActiveIndex(-1);

    setTimeout(() => {
      if (textareaRef.current) {
        const pos = wordStartRef.current + suggestion.length + 1;
        textareaRef.current.setSelectionRange(pos, pos);
        textareaRef.current.focus();
      }
    }, 0);
  }

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        {...props}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={(e) => {
          onBlur?.(e);
          setTimeout(() => {
            setShowSuggestions(false);
            setActiveIndex(-1);
          }, 200);
        }}
      />
      {showSuggestions && tamilMode && suggestions.length > 0 && (
        <div
          ref={listRef}
          className="absolute z-50 top-full left-0 mt-1 bg-white border rounded-lg shadow-lg min-w-[180px] overflow-hidden"
          style={{ borderColor: "#e2e8f0" }}
        >
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              className="w-full text-left px-4 py-2 text-sm font-medium transition-colors flex items-center justify-between gap-2"
              style={{
                backgroundColor: i === activeIndex ? "#e6f7f8" : "",
                color: i === activeIndex ? "#0D5C63" : "#2c3338",
              }}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(-1)}
              onMouseDown={() => selectSuggestion(s)}
            >
              <span>{s}</span>
              {i === activeIndex && (
                <span
                  className="text-xs font-bold px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: "#0D5C63", color: "#fff", fontSize: "10px" }}
                >
                  ↵
                </span>
              )}
            </button>
          ))}
          <div
            className="px-3 py-1.5 flex items-center gap-3 border-t"
            style={{ borderColor: "#f1f5f9", backgroundColor: "#f8fafc" }}
          >
            <span className="text-xs flex items-center gap-1" style={{ color: "#abb3b9" }}>
              <kbd className="px-1 py-0.5 rounded text-xs border" style={{ borderColor: "#dce3e9", backgroundColor: "#fff" }}>↑</kbd>
              <kbd className="px-1 py-0.5 rounded text-xs border" style={{ borderColor: "#dce3e9", backgroundColor: "#fff" }}>↓</kbd>
              navigate
            </span>
            <span className="text-xs flex items-center gap-1" style={{ color: "#abb3b9" }}>
              <kbd className="px-1 py-0.5 rounded text-xs border" style={{ borderColor: "#dce3e9", backgroundColor: "#fff" }}>↵</kbd>
              select
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
