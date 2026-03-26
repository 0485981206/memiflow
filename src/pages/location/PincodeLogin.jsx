import React, { useState } from "react";
import { Delete, LogIn, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PincodeLogin({ onLogin, error, loading }) {
  const [pin, setPin] = useState("");

  const handleDigit = (d) => {
    if (pin.length < 6) {
      const newPin = pin + d;
      setPin(newPin);
      if (newPin.length === 6) {
        onLogin(newPin);
      }
    }
  };

  const handleDelete = () => setPin(pin.slice(0, -1));
  const handleClear = () => setPin("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f2744] to-[#1a3a5c] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">HR.iQ</h1>
          <p className="text-sm text-gray-500 mt-1">Klokregistratie</p>
          <p className="text-xs text-gray-400 mt-1">Voer uw 6-cijferige pincode in</p>
        </div>

        {/* Pin dots */}
        <div className="flex justify-center gap-3 mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                i < pin.length
                  ? "bg-[#0f2744] border-[#0f2744] scale-110"
                  : "bg-transparent border-gray-300"
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-center text-sm text-red-500 mb-4 font-medium">{error}</p>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              onClick={() => handleDigit(String(n))}
              disabled={loading}
              className="h-16 rounded-xl bg-gray-50 hover:bg-gray-100 active:bg-gray-200 text-2xl font-semibold text-gray-800 transition-all duration-150"
            >
              {n}
            </button>
          ))}
          <button
            onClick={handleClear}
            disabled={loading}
            className="h-16 rounded-xl bg-gray-50 hover:bg-gray-100 text-xs font-medium text-gray-500 transition-all"
          >
            Wis
          </button>
          <button
            onClick={() => handleDigit("0")}
            disabled={loading}
            className="h-16 rounded-xl bg-gray-50 hover:bg-gray-100 active:bg-gray-200 text-2xl font-semibold text-gray-800 transition-all duration-150"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="h-16 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-all"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Inloggen...
          </div>
        )}
      </div>
    </div>
  );
}