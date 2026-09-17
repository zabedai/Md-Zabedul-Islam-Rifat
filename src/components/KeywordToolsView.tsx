import React, { useState } from 'react';
import { Tag, Copy, Check, Sparkles, Trash2, ArrowUpDown, Filter, Wand2 } from 'lucide-react';

export const KeywordToolsView: React.FC = () => {
  const [inputText, setInputText] = useState(
    'coffee, latte, morning, breakfast, wooden table, cafe, aroma, warm, beverage, coffee, LATTE, espresso, mug, cup, drink, coffee beans, rustic, closeup, top view, food photography, nobody, copy space, cozy, fresh, brown'
  );
  const [copied, setCopied] = useState(false);
  const [limitCount, setLimitCount] = useState<number>(40);

  // Parse keywords
  const parseKeywords = (text: string): string[] => {
    return text
      .split(/[,\n\r;]+/)
      .map((k) => k.trim())
      .filter((k) => k.length > 0);
  };

  const rawKeywords = parseKeywords(inputText);

  // Operations
  const handleDeduplicate = () => {
    const seen = new Set<string>();
    const cleaned: string[] = [];
    for (const kw of rawKeywords) {
      const lower = kw.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        cleaned.push(lower);
      }
    }
    setInputText(cleaned.join(', '));
  };

  const handleSortAZ = () => {
    const unique = Array.from(new Set(rawKeywords.map((k) => k.toLowerCase()))).sort();
    setInputText(unique.join(', '));
  };

  const handleSortLength = () => {
    const unique = Array.from(new Set(rawKeywords.map((k) => k.toLowerCase()))).sort(
      (a, b) => b.length - a.length
    );
    setInputText(unique.join(', '));
  };

  const handleRemoveShort = () => {
    const cleaned = rawKeywords.filter((k) => k.length > 2);
    setInputText(cleaned.join(', '));
  };

  const handleLimitTags = () => {
    const unique = Array.from(new Set(rawKeywords.map((k) => k.toLowerCase())));
    setInputText(unique.slice(0, limitCount).join(', '));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const uniqueCount = new Set(rawKeywords.map((k) => k.toLowerCase())).size;
  const duplicateCount = rawKeywords.length - uniqueCount;

  return (
    <div id="keyword-tools-view" className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Tag className="w-5 h-5 text-blue-600" />
              Stock Keyword Sanitizer & Formatter
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Clean, deduplicate, reorder, and format keywords for instant compliance with any stock agency.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Clean Keywords'}</span>
            </button>
          </div>
        </div>

        {/* Input & Output Area */}
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">Paste or Type Keywords</span>
            <div className="flex items-center gap-3 text-slate-500">
              <span>Total: <strong className="text-slate-800">{rawKeywords.length}</strong></span>
              <span>Unique: <strong className="text-emerald-700">{uniqueCount}</strong></span>
              {duplicateCount > 0 && (
                <span className="text-amber-600 font-bold">({duplicateCount} duplicates)</span>
              )}
            </div>
          </div>

          <textarea
            rows={5}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste keywords separated by commas or line breaks..."
            className="w-full px-3.5 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs sm:text-sm font-mono text-slate-800"
          />

          {/* Action Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleDeduplicate}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              <span>Remove Duplicates</span>
            </button>

            <button
              type="button"
              onClick={handleSortAZ}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />
              <span>Sort A-Z</span>
            </button>

            <button
              type="button"
              onClick={handleSortLength}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />
              <span>Sort by Length</span>
            </button>

            <button
              type="button"
              onClick={handleRemoveShort}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
            >
              Filter &lt; 3 Chars
            </button>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <span className="text-[11px] font-medium text-slate-600 px-1">Trim to:</span>
              {[30, 40, 49].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => {
                    setLimitCount(cnt);
                    const unique = Array.from(new Set(rawKeywords.map((k) => k.toLowerCase())));
                    setInputText(unique.slice(0, cnt).join(', '));
                  }}
                  className="px-2 py-0.5 rounded bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-700 shadow-2xs"
                >
                  {cnt}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setInputText('')}
              className="ml-auto text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 px-2 py-1 hover:bg-rose-50 rounded"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Visual Tag Preview */}
      {rawKeywords.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Parsed Keyword Tags ({rawKeywords.length})
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {rawKeywords.map((kw, i) => (
              <span
                key={`${kw}-${i}`}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                  i < 10
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <span className="text-[10px] text-slate-400 font-mono">#{i + 1}</span>
                <span>{kw}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
