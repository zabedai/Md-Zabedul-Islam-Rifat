import React from 'react';
import { StockImageItem, MarketplaceId } from '../types';
import { MARKETPLACE_CONFIGS } from '../services/marketplaceRules';
import {
  Wand2,
  Layers,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Image as ImageIcon,
  ArrowRight,
  ShieldCheck,
  Zap,
  Tag
} from 'lucide-react';

interface Props {
  items: StockImageItem[];
  selectedMarketplace: MarketplaceId;
  onNavigate: (tab: any) => void;
  onStartGenerating: () => void;
  isGenerating: boolean;
}

export const DashboardOverview: React.FC<Props> = ({
  items,
  selectedMarketplace,
  onNavigate,
  onStartGenerating,
  isGenerating
}) => {
  const config = MARKETPLACE_CONFIGS[selectedMarketplace] || MARKETPLACE_CONFIGS['adobe-stock'];

  const total = items.length;
  const completed = items.filter((i) => !!i.metadata).length;
  const readyStock = items.filter((i) => (i.metadata?.qualityAudit?.overallScore || 0) >= 85).length;
  const pending = total - completed;

  const avgScore =
    completed > 0
      ? Math.round(
          items.reduce((acc, curr) => acc + (curr.metadata?.qualityAudit?.overallScore || 0), 0) / completed
        )
      : 0;

  return (
    <div id="dashboard-overview" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>AI Stock Contributor Workspace</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Generate Stock-Ready Metadata in Seconds
          </h2>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Multimodal AI analysis tuned for <strong>Adobe Stock</strong>, <strong>Shutterstock</strong>, <strong>Freepik</strong>, and <strong>iStock</strong>. Objective visual descriptions, high-intent keyword ranking, and strict anti-rejection compliance.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('generate')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-600/30 transition active:scale-95"
            >
              <Wand2 className="w-4 h-4" />
              <span>Open Metadata Generator</span>
            </button>

            {pending > 0 && (
              <button
                type="button"
                disabled={isGenerating}
                onClick={onStartGenerating}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs sm:text-sm transition backdrop-blur-xs"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Analyze {pending} Pending Images</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Uploaded</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ImageIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{total}</span>
            <span className="text-xs text-slate-400 ml-1.5">images</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {pending > 0 ? `${pending} waiting for analysis` : 'All processed'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Completed</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{completed}</span>
            <span className="text-xs text-slate-400 ml-1.5">ready</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {total > 0 ? `${Math.round((completed / total) * 100)}% batch completion` : 'No active batch'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Stock Ready</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-indigo-600">{readyStock}</span>
            <span className="text-xs text-slate-400 ml-1.5">&gt;85 score</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Meets strict agency submission rules
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Avg Quality Score</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{avgScore}</span>
            <span className="text-xs text-slate-400 ml-1">/100</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Based on transparent acceptance audits
          </p>
        </div>
      </div>

      {/* Target Agency Quick Spec Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Active Optimization Profile: {config.name}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Metadata outputs automatically match {config.name}'s contributor taxonomy and search guidelines.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('settings')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>Change Default</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="font-bold text-slate-700 block mb-1">Title Criteria</span>
            <p className="text-slate-500 leading-relaxed">
              Between {config.minTitleLength} and {config.maxTitleLength} characters. Objective nouns first, zero spam adjectives.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="font-bold text-slate-700 block mb-1">Keyword Strategy</span>
            <p className="text-slate-500 leading-relaxed">
              Sweet spot: {config.recommendedKeywordsCount[0]}-{config.recommendedKeywordsCount[1]} tags. First 10 tags prioritized for ranking algorithm.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="font-bold text-slate-700 block mb-1">Taxonomy Categories</span>
            <p className="text-slate-500 leading-relaxed">
              {config.categories.length} official categories loaded including {config.categories.slice(0, 3).join(', ')}, etc.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
