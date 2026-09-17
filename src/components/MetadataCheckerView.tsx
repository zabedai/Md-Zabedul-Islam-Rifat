import React, { useState } from 'react';
import { MarketplaceId, StockMetadata } from '../types';
import { MARKETPLACE_CONFIGS } from '../services/marketplaceRules';
import { auditMetadata } from '../services/qualityScorer';
import { QualityScoreBadge } from './QualityScoreBadge';
import { CheckCircle2, AlertCircle, ShieldAlert, Sparkles } from 'lucide-react';

export const MetadataCheckerView: React.FC = () => {
  const [selectedMarketplace, setSelectedMarketplace] = useState<MarketplaceId>('adobe-stock');
  const [title, setTitle] = useState('Vintage espresso maker brewing coffee on wooden table');
  const [description, setDescription] = useState(
    'Close-up of traditional Italian moka pot brewing fresh espresso coffee on a rustic wooden table with morning sunlight in a cozy kitchen.'
  );
  const [keywordsText, setKeywordsText] = useState(
    'coffee, espresso, moka pot, italian, brewing, morning, breakfast, wooden table, rustic, kitchen, caffeine, aroma, hot, beverage, drink, fresh, sunlight, cozy, traditional, closeup, nobody, food photography, still life, lifestyle, dark roast, preparation, authentic'
  );

  const parsedKeywords = keywordsText
    .split(/[,;\n]+/)
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);

  const metadata: StockMetadata = {
    title,
    description,
    keywords: parsedKeywords,
    primaryKeywords: parsedKeywords.slice(0, 10),
    secondaryKeywords: parsedKeywords.slice(10),
    category: 'Food',
    contentType: 'Photo',
    commercialEditorial: 'Commercial',
    commercialReason: 'Tested via standalone auditor.'
  };

  const audit = auditMetadata(metadata, selectedMarketplace);

  const handleFixDuplicates = () => {
    const unique = Array.from(new Set(parsedKeywords));
    setKeywordsText(unique.join(', '));
  };

  return (
    <div id="metadata-checker-view" className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              Stock Acceptance Rule Auditor
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Check your stock metadata against real acceptance guidelines before submitting.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Audit Against:</span>
            <select
              value={selectedMarketplace}
              onChange={(e) => setSelectedMarketplace(e.target.value as MarketplaceId)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-blue-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {(Object.keys(MARKETPLACE_CONFIGS) as MarketplaceId[]).map((mId) => (
                <option key={mId} value={mId}>
                  {MARKETPLACE_CONFIGS[mId].name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Quality Badge */}
        <div className="mt-4">
          <QualityScoreBadge audit={audit} onAutoFixDuplicates={handleFixDuplicates} />
        </div>

        {/* Inputs */}
        <div className="mt-6 space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs mb-1 font-bold text-slate-700">
              <label>Title Under Test</label>
              <span className="text-slate-400 font-normal">
                {title.length} / {MARKETPLACE_CONFIGS[selectedMarketplace]?.maxTitleLength || 70} characters
              </span>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1 font-bold text-slate-700">
              <label>Description Under Test</label>
              <span className="text-slate-400 font-normal">
                {description.split(/\s+/).filter(Boolean).length} words
              </span>
            </div>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1 font-bold text-slate-700">
              <label>Keywords List</label>
              <span className="text-slate-400 font-normal">
                {parsedKeywords.length} tags ({new Set(parsedKeywords).size} unique)
              </span>
            </div>
            <textarea
              rows={4}
              value={keywordsText}
              onChange={(e) => setKeywordsText(e.target.value)}
              placeholder="Comma separated keywords..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
