import React, { useState, useMemo, useRef, useEffect } from "react";
import * as Icons from "lucide-react";

export interface CountryItem {
  code: string;
  name: string;
  prefix: string;
}

export const COUNTRIES: CountryItem[] = [
  { code: "SA", name: "Saudi Arabia", prefix: "+966" },
  { code: "AE", name: "United Arab Emirates", prefix: "+971" },
  { code: "QA", name: "Qatar", prefix: "+974" },
  { code: "OM", name: "Oman", prefix: "+968" },
  { code: "KW", name: "Kuwait", prefix: "+965" },
  { code: "BH", name: "Bahrain", prefix: "+973" },
  { code: "EG", name: "Egypt", prefix: "+20" },
  { code: "US", name: "United States", prefix: "+1" },
  { code: "GB", name: "United Kingdom", prefix: "+44" },
  { code: "IN", name: "India", prefix: "+91" },
  { code: "SG", name: "Singapore", prefix: "+65" },
];

interface PhoneCountryCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}

export function PhoneCountryCodeInput({
  value = "",
  onChange,
  placeholder = "Enter phone number",
  id,
}: PhoneCountryCodeInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Helper: Extract current prefix and local number from full string value
  const { currentCountry, localNumber } = useMemo(() => {
    // If empty
    if (!value) {
      return { currentCountry: COUNTRIES[0], localNumber: "" };
    }

    // Try to find the matching prefix in the string
    // Sort prefixes by length descending so eg +966 matches before +96 if +96 existed
    const sortedCountries = [...COUNTRIES].sort((a, b) => b.prefix.length - a.prefix.length);
    const trimmedVal = value.trim();

    for (const c of sortedCountries) {
      if (trimmedVal.startsWith(c.prefix)) {
        let rest = trimmedVal.slice(c.prefix.length).trim();
        return { currentCountry: c, localNumber: rest };
      }
    }

    // Default if not matching
    return { currentCountry: COUNTRIES[0], localNumber: value };
  }, [value]);

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter countries based on search term
  const filteredCountries = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.prefix.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handlePrefixChange = (country: CountryItem) => {
    onChange(`${country.prefix} ${localNumber}`);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawNumber = e.target.value;
    onChange(`${currentCountry.prefix} ${rawNumber}`);
  };

  return (
    <div className="flex gap-2 relative w-full items-center font-sans" ref={dropdownRef}>
      {/* 1. Country code prefix selector button & dropdown portal container */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="h-[38px] px-2 py-2 text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-300 rounded-lg shadow-sm hover:bg-slate-100 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] transition-colors flex items-center justify-between gap-1 w-[95px] shrink-0"
          id={`${id}-prefix-btn`}
        >
          <span className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400 font-extrabold">{currentCountry.code}</span>
            <span className="text-slate-700 text-sm">{currentCountry.prefix}</span>
          </span>
          <Icons.ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {/* Dropdown element */}
        {isOpen && (
          <div className="absolute left-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 select-none animate-in fade-in slide-in-from-top-2 duration-100">
            {/* Search inputs */}
            <div className="relative mb-2">
              <Icons.Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search country or code..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] font-medium text-slate-700"
                autoFocus
              />
            </div>

            {/* Scrollable list */}
            <div className="max-h-48 overflow-y-auto space-y-0.5 pr-1 divide-y divide-slate-50">
              {filteredCountries.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400 font-medium">No countries found</div>
              ) : (
                filteredCountries.map((c) => {
                  const isSelected = c.code === currentCountry.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => handlePrefixChange(c)}
                      className={`w-full flex items-center justify-between px-2 py-2 text-left text-xs rounded-lg transition-colors ${
                        isSelected
                          ? "bg-[#F0EBFF] text-[#683EFF] font-semibold"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={`w-6 text-center font-bold text-[10px] uppercase rounded px-1 py-0.5 ${
                          isSelected ? "bg-[#DED3FF] text-[#683EFF]" : "bg-slate-100 text-slate-500"
                        }`}>
                          {c.code}
                        </span>
                        <span className="truncate max-w-[120px]">{c.name}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className={`${isSelected ? "text-[#683EFF]" : "text-slate-400"} font-medium font-mono`}>
                          {c.prefix}
                        </span>
                        {isSelected && <Icons.Check className="w-3.5 h-3.5 text-[#683EFF]" />}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. Main Phone text field */}
      <input
        type="text"
        id={id}
        value={localNumber}
        onChange={handleNumberChange}
        placeholder={placeholder}
        className="flex-1 min-w-0 h-[38px] px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#683EFF]/20 focus:border-[#683EFF] font-medium text-slate-700 bg-slate-50"
      />
    </div>
  );
}
