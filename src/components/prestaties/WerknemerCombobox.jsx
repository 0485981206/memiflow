import React, { useState, useRef, useEffect } from "react";

export default function WerknemerCombobox({ werknemers, value, onChange }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const selected = werknemers.find((w) => w.id === value);

  const filtered = werknemers.filter((w) => {
    const naam = `${w.voornaam} ${w.achternaam}`.toLowerCase();
    return naam.includes(query.toLowerCase());
  });

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (w) => {
    onChange(w.id);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="text"
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        placeholder={selected ? `${selected.voornaam} ${selected.achternaam}` : "Zoek werknemer..."}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-52 w-full overflow-auto rounded-md border bg-popover text-sm shadow-md">
          {filtered.map((w) => (
            <li
              key={w.id}
              className={`cursor-pointer px-3 py-2 hover:bg-accent hover:text-accent-foreground ${value === w.id ? "bg-accent/50 font-medium" : ""}`}
              onMouseDown={() => handleSelect(w)}
            >
              {w.voornaam} {w.achternaam}
            </li>
          ))}
        </ul>
      )}
      {open && filtered.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover px-3 py-2 text-sm text-muted-foreground shadow-md">
          Geen resultaten
        </div>
      )}
    </div>
  );
}