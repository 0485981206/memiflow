import React, { useState, useRef, useEffect } from "react";

export default function WerknemerCombobox({ werknemers, value, onChange, placeholder = "Zoek werknemer...", allowEmpty = false }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const selected = werknemers.find((w) => w.id === value);

  const filtered = werknemers.filter((w) => {
    const naam = `${w.voornaam} ${w.achternaam}`.toLowerCase();
    const ovnr = (w.overeenkomstnummer || "").toLowerCase();
    const q = query.toLowerCase();
    return naam.includes(q) || ovnr.includes(q);
  });

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
    onChange(w ? w.id : "");
    setQuery("");
    setOpen(false);
  };

  const displayPlaceholder = selected
    ? `${selected.voornaam} ${selected.achternaam}`
    : placeholder;

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="text"
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        placeholder={displayPlaceholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && (
        <ul className="absolute z-50 mt-1 max-h-52 w-full overflow-auto rounded-md border bg-popover text-sm shadow-md">
          {allowEmpty && (
            <li
              className={`cursor-pointer px-3 py-2 hover:bg-accent hover:text-accent-foreground ${!value ? "bg-accent/50 font-medium" : ""}`}
              onMouseDown={() => handleSelect(null)}
            >
              {placeholder}
            </li>
          )}
          {filtered.length === 0 && (
            <li className="px-3 py-2 text-muted-foreground">Geen resultaten</li>
          )}
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
    </div>
  );
}