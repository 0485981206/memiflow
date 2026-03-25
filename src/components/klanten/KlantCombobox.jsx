import React, { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";

export default function KlantCombobox({ klanten, value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  const selected = klanten.find((k) => k.id === value);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = klanten.filter((k) =>
    (k.naam || "").toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (k) => {
    onChange(k.id);
    setQuery("");
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setQuery("");
  };

  return (
    <div className="relative" ref={ref}>
      <div
        className="flex items-center gap-2 border rounded-md px-3 h-9 cursor-pointer bg-background hover:border-primary transition-colors"
        onClick={() => setOpen(true)}
      >
        <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        {open ? (
          <input
            autoFocus
            className="flex-1 text-sm bg-transparent outline-none"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className={`flex-1 text-sm truncate ${selected ? "" : "text-muted-foreground"}`}>
            {selected ? selected.naam : placeholder}
          </span>
        )}
        {selected && !open && (
          <button onClick={handleClear} className="text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">Geen resultaten</div>
          ) : (
            filtered.map((k) => (
              <div
                key={k.id}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground ${value === k.id ? "bg-accent/20 font-medium" : ""}`}
                onClick={() => handleSelect(k)}
              >
                {k.naam}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}