import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, X } from 'lucide-react';
import { searchLocations } from '../../services/api';

export default function GlobalCitySearch({
  selectedLocation,
  onSelectLocation,
  placeholder = 'Search any city worldwide...',
  className = ''
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Sync display with selected location when not actively editing
  useEffect(() => {
    if (!isOpen && selectedLocation?.city) {
      setQuery(selectedLocation.city);
    }
  }, [selectedLocation, isOpen]);

  // Debounced geocoding search
  useEffect(() => {
    const trimmed = query.trim();
    if (!isOpen || trimmed.length < 2) {
      setResults([]);
      setIsLoading(false);
      setHasSearched(false);
      return;
    }

    // If query matches the currently selected city exactly, do not search unless user changed it
    if (selectedLocation?.city && trimmed.toLowerCase() === selectedLocation.city.toLowerCase() && !hasSearched) {
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await searchLocations(trimmed, 8);
        setResults(data || []);
        setHasSearched(true);
      } catch (err) {
        console.error('Failed to search locations:', err);
        setResults([]);
        setHasSearched(true);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, isOpen, selectedLocation]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        if (selectedLocation?.city) {
          setQuery(selectedLocation.city);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedLocation]);

  const handleSelect = (loc) => {
    // Store: latitude, longitude, city, region, country, timezone
    const locationData = {
      latitude: loc.latitude,
      longitude: loc.longitude,
      city: loc.city,
      region: loc.region || '',
      country: loc.country || '',
      timezone: loc.timezone || 'UTC'
    };

    onSelectLocation(locationData);
    setQuery(loc.city);
    setIsOpen(false);
    setResults([]);
    setHasSearched(false);
    setHighlightedIndex(-1);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setIsOpen(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < results.length) {
        handleSelect(results[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      if (selectedLocation?.city) {
        setQuery(selectedLocation.city);
      }
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Bar Input Container */}
      <div 
        className="flex items-center gap-2 bg-slate-900/80 px-2.5 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/30 transition-all duration-200"
      >
        <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none placeholder:text-slate-500 placeholder:font-normal w-full"
          aria-label="Search city worldwide"
          autoComplete="off"
        />

        {/* Loading Spinner or Clear Button */}
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin shrink-0 mr-1" />
        ) : query ? (
          <button
            type="button"
            onClick={handleClear}
            className="p-0.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>

      {/* Autocomplete Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute left-0 right-0 mt-2 z-50 bg-slate-950/95 backdrop-blur-2xl border border-slate-800/90 rounded-xl shadow-2xl shadow-slate-950/80 overflow-hidden divide-y divide-slate-800/60 max-h-72 overflow-y-auto"
        >
          {/* Loading State */}
          {isLoading && results.length === 0 && (
            <div className="flex items-center justify-center gap-2.5 py-4 px-3 text-xs text-slate-400">
              <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
              <span>Searching global locations...</span>
            </div>
          )}

          {/* No Locations Found State */}
          {!isLoading && hasSearched && results.length === 0 && query.trim().length >= 2 && (
            <div className="py-4 px-3 text-center text-xs text-slate-400">
              <p className="font-medium text-slate-300">No locations found</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Try searching with a city or country name</p>
            </div>
          )}

          {/* Prompt to type at least 2 characters if input is too short */}
          {!isLoading && query.trim().length < 2 && (
            <div className="py-3 px-3 text-center text-xs text-slate-500">
              Type at least 2 characters to search worldwide...
            </div>
          )}

          {/* Autocomplete Results List */}
          {results.map((loc, idx) => {
            const isHighlighted = idx === highlightedIndex;
            const subtitle = [loc.region, loc.country].filter(Boolean).join(', ');

            return (
              <div
                key={loc.id || `${loc.latitude}-${loc.longitude}-${idx}`}
                onClick={() => handleSelect(loc)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`flex items-center justify-between px-3 py-2.5 cursor-pointer transition-colors ${
                  isHighlighted ? 'bg-slate-800/80 text-white' : 'hover:bg-slate-900 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-white truncate">
                      {loc.city}
                    </div>
                    {subtitle && (
                      <div className="text-[10px] text-slate-400 truncate">
                        {subtitle}
                      </div>
                    )}
                  </div>
                </div>

                {/* Latitude & Longitude Metadata */}
                <div className="text-[10px] text-slate-500 font-mono shrink-0 ml-2">
                  {loc.latitude?.toFixed(2)}°, {loc.longitude?.toFixed(2)}°
                </div>
              </div>
            );
          })}

          {/* Information message */}
          <div className="px-3 py-2 bg-slate-900/90 text-[10px] text-slate-400 border-t border-slate-800/80 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            <span>AirSense AI uses available real-time environmental data. Data availability varies by location.</span>
          </div>
        </div>
      )}
    </div>
  );
}
