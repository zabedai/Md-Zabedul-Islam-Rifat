import React, { useState, useEffect } from 'react';
import { StockImageItem, StockMetadata, MarketplaceId, ContentType, CommercialType } from '../types';
import { MARKETPLACE_CONFIGS } from '../services/marketplaceRules';
import { auditMetadata } from '../services/qualityScorer';
import { requestKeywordSuggestions } from '../services/api';
import { QualityScoreBadge } from './QualityScoreBadge';
import { copyMetadataToClipboard, downloadCSV, downloadXLSX, downloadTXT } from '../services/exporter';
import {
  Sparkles,
  Copy,
  Check,
  Plus,
  X,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Download,
  AlertCircle,
  FileText,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Tag
} from 'lucide-react';

interface Props {
  item: StockImageItem;
  marketplaceId: MarketplaceId;
  onUpdateItem: (updated: StockImageItem) => void;
  onRegenerate: (item: StockImageItem) => void;
  isGenerating: boolean;
}

export const MetadataEditor: React.FC<Props> = ({
  item,
  marketplaceId,
  onUpdateItem,
  onRegenerate,
  isGenerating
}) => {
  const config = MARKETPLACE_CONFIGS[marketplaceId] || MARKETPLACE_CONFIGS['adobe-stock'];

  // Local draft state
  const [title, setTitle] = useState(item.metadata?.title || '');
  const [description, setDescription] = useState(item.metadata?.description || '');
  const [keywords, setKeywords] = useState<string[]>(item.metadata?.keywords || []);
  const [category, setCategory] = useState(item.metadata?.category || config.categories[0] || 'Lifestyle');
  const [contentType, setContentType] = useState<ContentType>(item.metadata?.contentType || 'Photo');
  const [commercialEditorial, setCommercialEditorial] = useState<CommercialType>(
    item.metadata?.commercialEditorial || 'Commercial'
  );

  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [isSuggestingMore, setIsSuggestingMore] = useState(false);

  // Sync draft when active item changes
  useEffect(() => {
    setTitle(item.metadata?.title || '');
    setDescription(item.metadata?.description || '');
    setKeywords(item.metadata?.keywords || []);
    setCategory(item.metadata?.category || config.categories[0] || 'Lifestyle');
    setContentType(item.metadata?.contentType || 'Photo');
    setCommercialEditorial(item.metadata?.commercialEditorial || 'Commercial');
  }, [item.id, item.metadata]);

  // Compute live quality audit on draft state
  const currentDraftMetadata: StockMetadata = {
    title,
    description,
    keywords,
    primaryKeywords: keywords.slice(0, 10),
    secondaryKeywords: keywords.slice(10),
    category,
    contentType,
    commercialEditorial,
    commercialReason: item.metadata?.commercialReason || 'Visible content checked.'
  };
  const liveAudit = auditMetadata(currentDraftMetadata, marketplaceId);

  // Save changes to parent item
  const handleSave = () => {
    const updatedMetadata: StockMetadata = {
      ...currentDraftMetadata,
      qualityAudit: liveAudit
    };
    onUpdateItem({
      ...item,
      metadata: updatedMetadata,
      status: 'completed',
      updatedAt: Date.now()
    });
  };

  // Auto-save on blur or keyword changes
  const commitUpdate = (newFields: Partial<StockMetadata>) => {
    const nextMeta: StockMetadata = {
      ...currentDraftMetadata,
      ...newFields
    };
    nextMeta.qualityAudit = auditMetadata(nextMeta, marketplaceId);
    onUpdateItem({
      ...item,
      metadata: nextMeta,
      status: 'completed',
      updatedAt: Date.now()
    });
  };

  // Keyword operations
  const handleAddKeyword = () => {
    const clean = newKeywordInput.trim().toLowerCase();
    if (!clean) return;

    // Support comma-separated batch pasting in input
    const parts = clean
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const updated = [...keywords];
    for (const p of parts) {
      if (!updated.includes(p)) {
        updated.push(p);
      }
    }
    setKeywords(updated);
    setNewKeywordInput('');
    commitUpdate({ keywords: updated });
  };

  const handleRemoveKeyword = (index: number) => {
    const updated = keywords.filter((_, i) => i !== index);
    setKeywords(updated);
    commitUpdate({ keywords: updated });
  };

  const handleMoveKeyword = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= keywords.length) return;

    const copy = [...keywords];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    setKeywords(copy);
    commitUpdate({ keywords: copy });
  };

  const handleAutoFixDuplicates = () => {
    const unique: string[] = Array.from(new Set(keywords.map((k) => k.toLowerCase().trim()))).filter((k): k is string => Boolean(k));
    setKeywords(unique);
    commitUpdate({ keywords: unique });
  };

  const handleCopyKeywords = () => {
    navigator.clipboard.writeText(keywords.join(', '));
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 1800);
  };

  const handleCopyFullMetadata = async () => {
    await copyMetadataToClipboard([item]);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1800);
  };

  const handleSuggestMoreKeywords = async () => {
    setIsSuggestingMore(true);
    try {
      const suggestions = await requestKeywordSuggestions(title, description, keywords);
      if (suggestions && suggestions.length > 0) {
        const merged = Array.from(new Set([...keywords, ...suggestions]));
        setKeywords(merged);
        commitUpdate({ keywords: merged });
      }
    } finally {
      setIsSuggestingMore(false);
    }
  };

  return (
    <div id="metadata-editor-panel" className="space-y-6">
      {/* Top Header Card with Image Info and Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
              <img
                src={item.previewUrl}
                alt={item.filename}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                  {item.filename}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${config.badgeColor}`}>
                  {config.name}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Target marketplace limits: Title max {config.maxTitleLength} chars • Keywords target {config.recommendedKeywordsCount[0]}-{config.recommendedKeywordsCount[1]}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => onRegenerate(item)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Analyzing...' : 'Regenerate'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyFullMetadata}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedAll ? 'Copied!' : 'Copy Metadata'}</span>
            </button>

            <div className="flex items-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition">
              <button
                type="button"
                onClick={() => downloadCSV([item], marketplaceId)}
                className="px-3 py-2 hover:bg-blue-700 rounded-l-xl flex items-center gap-1.5"
                title="Download CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
              <button
                type="button"
                onClick={() => downloadXLSX([item], marketplaceId)}
                className="px-2.5 py-2 border-l border-blue-500 hover:bg-blue-700 rounded-r-xl"
                title="Download XLSX Excel"
              >
                XLSX
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Quality Score Card */}
        <div className="mt-4">
          <QualityScoreBadge
            audit={liveAudit}
            onAutoFixDuplicates={handleAutoFixDuplicates}
          />
        </div>
      </div>

      {/* Editor Fields Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Title, Description, Category, Content Type */}
        <div className="lg:col-span-2 space-y-5 bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs">
          {/* TITLE FIELD */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="meta-title-input" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Title
              </label>
              <span
                className={`text-xs font-medium ${
                  title.length > config.maxTitleLength
                    ? 'text-rose-600 font-bold'
                    : title.length < config.minTitleLength
                    ? 'text-amber-600'
                    : 'text-slate-400'
                }`}
              >
                {title.length} / {config.maxTitleLength} characters
              </span>
            </div>
            <input
              id="meta-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => commitUpdate({ title })}
              placeholder="e.g. Modern creative team collaborating around boardroom table in sunlit office"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm text-slate-800 transition"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Stock tip: Describe main subject, setting, and composition. Avoid subjective words like "stunning" or "best".
            </p>
          </div>

          {/* DESCRIPTION FIELD */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="meta-desc-input" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Description
              </label>
              <span className="text-xs text-slate-400">
                {description.split(/\s+/).filter(Boolean).length} words
              </span>
            </div>
            <textarea
              id="meta-desc-input"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => commitUpdate({ description })}
              placeholder="Full stock description describing visible details, setting, lighting, and composition..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm text-slate-800 transition"
            />
          </div>

          {/* CATEGORY & CONTENT TYPE SELECTORS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label htmlFor="meta-category-select" className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                Category ({config.name})
              </label>
              <select
                id="meta-category-select"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  commitUpdate({ category: e.target.value });
                }}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              >
                {config.categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="meta-content-type-select" className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                Content Type
              </label>
              <select
                id="meta-content-type-select"
                value={contentType}
                onChange={(e) => {
                  const val = e.target.value as ContentType;
                  setContentType(val);
                  commitUpdate({ contentType: val });
                }}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              >
                <option value="Photo">Photo</option>
                <option value="Illustration">Illustration</option>
                <option value="Vector">Vector</option>
                <option value="3D Render">3D Render</option>
                <option value="AI-Generated">AI-Generated</option>
              </select>
            </div>
          </div>

          {/* COMMERCIAL / EDITORIAL TOGGLE */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800">Licensing Model</span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {item.metadata?.commercialReason || 'Visible content checked for model/property releases.'}
                </p>
              </div>
              <div className="flex items-center bg-white p-1 rounded-lg border border-slate-200 shadow-xs">
                <button
                  type="button"
                  onClick={() => {
                    setCommercialEditorial('Commercial');
                    commitUpdate({ commercialEditorial: 'Commercial' });
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                    commercialEditorial === 'Commercial'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Commercial
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCommercialEditorial('Editorial');
                    commitUpdate({ commercialEditorial: 'Editorial' });
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                    commercialEditorial === 'Editorial'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Editorial
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: KEYWORD GENERATOR & INTERACTIVE TAGS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Keywords</h4>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    keywords.length >= config.recommendedKeywordsCount[0] &&
                    keywords.length <= config.recommendedKeywordsCount[1]
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {keywords.length} tags
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleCopyKeywords}
                  className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                  title="Copy all keywords"
                >
                  {copiedKey ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mb-3">
              Top 10 tags (highlighted in blue) receive search indexing priority on Adobe Stock and Shutterstock.
            </p>

            {/* Keyword Input Form */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newKeywordInput}
                onChange={(e) => setNewKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    handleAddKeyword();
                  }
                }}
                placeholder="Add keyword or comma-separated tags..."
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddKeyword}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Keyword Tags Container */}
            <div className="flex flex-wrap gap-1.5 max-h-[360px] overflow-y-auto pr-1 py-1">
              {keywords.map((kw, index) => {
                const isPrimary = index < 10;
                return (
                  <div
                    key={`${kw}-${index}`}
                    className={`group inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                      isPrimary
                        ? 'bg-blue-50 text-blue-800 border-blue-200/80 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-[10px] opacity-60 font-mono">#{index + 1}</span>
                    <span>{kw}</span>

                    {/* Reorder Buttons on hover */}
                    <div className="hidden group-hover:flex items-center gap-0.5 ml-0.5">
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => handleMoveKeyword(index, 'left')}
                          className="hover:text-blue-600 p-0.5"
                          title="Move up in rank"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                      )}
                      {index < keywords.length - 1 && (
                        <button
                          type="button"
                          onClick={() => handleMoveKeyword(index, 'right')}
                          className="hover:text-blue-600 p-0.5"
                          title="Move down in rank"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(index)}
                      className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition"
                      title="Remove keyword"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom helper actions */}
          <div className="pt-4 border-t border-slate-100 mt-4 space-y-2">
            <button
              type="button"
              disabled={isSuggestingMore}
              onClick={handleSuggestMoreKeywords}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isSuggestingMore ? 'animate-spin' : ''}`} />
              <span>{isSuggestingMore ? 'Finding relevant tags...' : 'AI Suggest 10 More Keywords'}</span>
            </button>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <button
                type="button"
                onClick={handleAutoFixDuplicates}
                className="hover:text-blue-600 underline"
              >
                Clean duplicates
              </button>
              <button
                type="button"
                onClick={() => {
                  const sorted = [...keywords].sort();
                  setKeywords(sorted);
                  commitUpdate({ keywords: sorted });
                }}
                className="hover:text-blue-600 underline"
              >
                Sort A-Z
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
