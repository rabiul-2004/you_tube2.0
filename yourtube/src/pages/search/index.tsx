import SearchResult from "@/components/SearchResult";
import { useRouter } from "next/router";
import React from "react";

const SearchPage = () => {
  const router = useRouter();
  const { q } = router.query;

  return (
    <div className="flex-1 p-4 sm:p-6 animate-fade-in">
      <div className="max-w-6xl mx-auto">
        {q && (
          <div className="mb-6">
            <h1 className="text-lg sm:text-xl font-medium">
              Search results for &ldquo;{q}&rdquo;
            </h1>
          </div>
        )}
        <SearchResult query={q || ""} />
      </div>
    </div>
  );
};

export default SearchPage;
