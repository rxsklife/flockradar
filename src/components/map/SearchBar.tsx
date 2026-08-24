'use client';

import { useState, useCallback } from 'react';
import type { EntitySummary } from '@/lib/types';

interface SearchBarProps {
  onSelect: (entity: EntitySummary) => void;
}

export default function SearchBar({ onSelect }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<EntitySummary[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const handleSearch = useCallback(async (q: string) => {
    setQuery(q);
    if (q.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setResults(data);
    setIsOpen(data.length > 0);
  }, []);

  return (
    <div className="absolute left-4 top-4 z-[1000] w-60 sm:w-64">
      <input
        type="text"
        placeholder="Search city, county, state, or agency..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        className="hud-chip w-full px-3! py-2! text-[16px] text-steel-100 placeholder:text-steel-400 shadow-sm sm:text-xs"
      />
      {isOpen && (
        <ul className="hud-panel mt-1 max-h-60 overflow-y-auto">
          {results.map((entity) => (
            <li
              key={entity.id}
              className="cursor-pointer px-4 py-2 text-sm text-steel-100 transition-colors hover:bg-radar-500/10"
              onClick={() => {
                onSelect(entity);
                setIsOpen(false);
                setQuery(entity.name);
              }}
            >
              <span className="font-medium">{entity.name}</span>
              <span className="ml-2 text-steel-400">
                {entity.city && `${entity.city}, `}
                {entity.state}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
