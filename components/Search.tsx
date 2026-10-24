"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Input } from "./ui/input";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getFiles } from "@/lib/actions/file.action";
import { Models } from "node-appwrite";
import Thumbnail from "./Thumbnail";
import FormattedDateTime from "./FormattedDateTime";
import { useDebounce } from "use-debounce";

const Search = () => {
  const [query, setQuery] = useState("");
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("query") || "";
  const [results, setResults] = useState<Models.Document[]>([]);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const path = usePathname();

  const [debouncedQuery] = useDebounce(query, 100);

  useEffect(() => {
    if (debouncedQuery.length === 0) {
      setResults([]);
      setOpen(false);
      // Clearing the box drops only the ?query param, keeping others such as ?sort.
      if (searchParams.has("query")) {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("query");
        router.replace(params.size ? `${path}?${params}` : path);
      }
      return;
    }

    // Ignore responses that arrive after a newer search has started.
    let stale = false;
    getFiles({ types: [], searchText: debouncedQuery }).then((files) => {
      if (stale) return;
      setResults(files.documents);
      setOpen(true);
    });
    return () => {
      stale = true;
    };
  }, [debouncedQuery, path, router, searchParams]);

  useEffect(() => {
    if (!searchQuery) {
      setQuery("");
    }
  }, [searchQuery]);

  const handleClickItem = (file: Models.Document) => {
    setOpen(false);
    setResults([]);

    router.push(
      `/${
        file.type === "video" || file.type === "audio"
          ? "media"
          : file.type + "s"
      }?query=${encodeURIComponent(query)}`
    );
  };

  return (
    <div className="search">
      <div className="search-input-wrapper">
        <Image
          src="/assets/icons/search.svg"
          alt="search"
          width={24}
          height={24}
        />
        <Input
          value={query}
          placeholder="Search..."
          className="search-input"
          onChange={(e) => setQuery(e.target.value)}
        />
        {open && (
          <ul className="search-result">
            {results.length > 0 ? (
              results.map((file) => (
                <li
                  className="flex items-center justify-between"
                  key={file.$id}
                  onClick={() => handleClickItem(file)}
                >
                  <div className="flex cursor-pointer items-center gap-4">
                    <Thumbnail
                      type={file.type}
                      extension={file.extension}
                      url={file.url}
                      className="size-9 min-w-9"
                    />
                    <p className="subtitle-2 line-clamp-1 text-[var(--light-100)]">
                      {file.name} {""}
                    </p>
                  </div>

                  <FormattedDateTime
                    date={file.$createdAt}
                    className="caption line-clamp-1 text-[var(--light-200)]"
                  />
                </li>
              ))
            ) : (
              <p className="empty-result">No files found</p>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Search;
