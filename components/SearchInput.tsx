import React, { useState, useRef } from 'react';

interface SearchInputProps {
  onSearch: (query: string) => void;
  onReset: () => void;
  isLoading: boolean;
  isIdle: boolean;
}

const SearchInput: React.FC<SearchInputProps> = ({ onSearch, onReset, isLoading, isIdle }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  const handleResetClick = () => {
    setQuery('');
    onReset();
    inputRef.current?.focus();
  };

  return (
    <div className={`w-full transition-all duration-500 ease-out ${isIdle ? 'bg-transparent py-10 sm:py-16' : 'bg-white border-b border-slate-200 py-6 mb-8'}`}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h2 className={`text-center transition-all duration-500 ${isIdle ? 'text-xl sm:text-2xl font-black text-white mb-8 leading-snug drop-shadow-md' : 'text-lg font-bold text-slate-800 mb-5'}`}>
          원하는 대학, 학과, 또는 진로를 검색해보세요
        </h2>
        <form onSubmit={handleSubmit} className="relative flex items-center group">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="예: 서울권 컴퓨터공학과, 연세대 경영학과..."
            className={`w-full h-14 sm:h-16 pl-5 sm:pl-6 pr-28 sm:pr-32 rounded-2xl shadow-xl border-4 text-lg sm:text-xl transition-all outline-none font-bold placeholder:text-slate-400 placeholder:font-medium placeholder:text-base sm:placeholder:text-lg
              ${isIdle
                ? 'border-emerald-400/50 focus:border-emerald-400 bg-white/95 text-slate-800 focus:ring-4 focus:ring-emerald-400/30'
                : 'border-slate-300 focus:border-emerald-600 bg-white text-slate-800 focus:ring-4 focus:ring-emerald-100'
              }`}
            disabled={isLoading}
          />

          {/* Reset (Undo/Refresh) Button */}
          {query && (
            <button
              type="button"
              onClick={handleResetClick}
              className="absolute right-14 sm:right-16 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors z-10"
              aria-label="되돌리기"
              title="다시 검색"
              disabled={isLoading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
          )}

          {/* Search Button - Colored background always, transparency for disabled */}
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className={`absolute right-2 top-1/2 -translate-y-1/2 text-white p-2 sm:p-3 rounded-xl transition-all duration-200 flex items-center justify-center shadow-md
              ${isLoading || !query.trim()
                ? 'bg-emerald-600 opacity-60 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 hover:scale-105 hover:shadow-lg'
              }`}
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 sm:h-6 sm:w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            )}
          </button>
        </form>

        {/* Tags */}
        <div className="mt-4 flex gap-2 justify-center flex-wrap">
          {["컴퓨터공학", "의예과", "경영학과"].map((tag) => (
            <button
              key={tag}
              onClick={() => { setQuery(tag); onSearch(tag); }}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors font-medium
                  ${isIdle
                  ? 'bg-white/10 text-emerald-100 border-white/20 hover:bg-white/20 hover:text-white hover:border-white/50'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-600'
                }`}
            >
              # {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchInput;