import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

import {
  Search,
  X,
  Building2,
  ContactRound,
  BriefcaseBusiness,
  LoaderCircle,
} from "lucide-react";

import { useGlobalSearch } from "../hooks/use-global-search";
import type { SearchItem } from "../types/search.types";

function GlobalSearch() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Debounce search by 350ms
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const { data, isFetching, isError } = useGlobalSearch(debouncedQuery, isOpen);

  const hasQuery = query.trim().length >= 2;
  const hasResults = (data?.total ?? 0) > 0;

  function handleSelect(item: SearchItem) {
    setIsOpen(false);
    setQuery("");
    setDebouncedQuery("");

    navigate(item.href);
  }

  function renderGroup(
    title: string,
    items: SearchItem[],
    Icon: typeof Building2,
  ) {
    if (items.length === 0) {
      return null;
    }

    return (
      <div className="py-2">
        <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {title}
        </div>

        {items.map((item) => (
          <button
            key={`${item.type}-${item.id}`}
            type="button"
            onClick={() => handleSelect(item)}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-slate-50"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Icon size={17} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">
                {item.title}
              </p>

              {item.subtitle && (
                <p className="truncate text-xs text-slate-500">
                  {item.subtitle}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative hidden lg:block">
      <div className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 transition focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
        <Search size={17} className="shrink-0 text-slate-400" />

        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setIsOpen(false);
            }
          }}
          placeholder="ค้นหา Companies, Contacts..."
          aria-label="ค้นหาข้อมูล"
          aria-expanded={isOpen}
          aria-controls="global-search-results"
          autoComplete="off"
          className="h-9 w-64 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setDebouncedQuery("");
              setIsOpen(true);
            }}
            aria-label="ล้างคำค้นหา"
            className="shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
          ></button>
        )}
      </div>

      {isOpen && (
        <div
          id="global-search-results"
          className="absolute right-0 top-full z-50 mt-2 w-[min(26rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
        >
          {!hasQuery ? (
            <div className="px-4 py-8 text-center">
              <Search size={24} className="mx-auto mb-2 text-slate-300" />

              <p className="text-sm font-medium text-slate-600">
                ค้นหาข้อมูลใน SalesFlow
              </p>

              <p className="mt-1 text-xs text-slate-400">
                พิมพ์อย่างน้อย 2 ตัวอักษร
              </p>
            </div>
          ) : isFetching ? (
            <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-slate-500">
              <LoaderCircle size={18} className="animate-spin" />
              กำลังค้นหา...
            </div>
          ) : isError ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm font-medium text-red-600">
                ไม่สามารถค้นหาข้อมูลได้
              </p>

              <p className="mt-1 text-xs text-slate-400">
                กรุณาลองใหม่อีกครั้ง
              </p>
            </div>
          ) : !hasResults ? (
            <div className="px-4 py-8 text-center">
              <Search size={24} className="mx-auto mb-2 text-slate-300" />

              <p className="text-sm font-medium text-slate-600">ไม่พบข้อมูล</p>

              <p className="mt-1 text-xs text-slate-400">ลองค้นหาด้วยคำอื่น</p>
            </div>
          ) : (
            <>
              <div className="max-h-[26rem] overflow-y-auto">
                {renderGroup("Companies", data?.companies ?? [], Building2)}

                {renderGroup("Contacts", data?.contacts ?? [], ContactRound)}

                {renderGroup("Deals", data?.deals ?? [], BriefcaseBusiness)}
              </div>

              <div className="border-t border-slate-100 bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-500">
                  พบทั้งหมด {data?.total ?? 0} รายการ
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default GlobalSearch;
