import React, { useState } from 'react';
import { MarketplaceId } from '../types';
import { MARKETPLACE_CONFIGS } from '../services/marketplaceRules';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  Download,
  Sparkles,
  Menu,
  Wifi,
  WifiOff,
  Check,
  ChevronDown,
  Info,
  ShieldCheck,
  Smartphone
} from 'lucide-react';

interface Props {
  selectedMarketplace: MarketplaceId;
  onSelectMarketplace: (m: MarketplaceId) => void;
  onToggleMobileSidebar: () => void;
  isOnline: boolean;
  hasGeminiKey: boolean;
  onGenerateMetadataClick: () => void;
  isGenerating: boolean;
  pendingCount: number;
}

export const Header: React.FC<Props> = ({
  selectedMarketplace,
  onSelectMarketplace,
  onToggleMobileSidebar,
  isOnline,
  hasGeminiKey,
  onGenerateMetadataClick,
  isGenerating,
  pendingCount
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showMarketDropdown, setShowMarketDropdown] = useState(false);

  const activeMarketplace = MARKETPLACE_CONFIGS[selectedMarketplace] || MARKETPLACE_CONFIGS['adobe-stock'];

  return (
    <header id="app-header" className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Brand */}
        <div className="flex items-center gap-3">
          <button
            id="mobile-sidebar-toggle"
            type="button"
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5 text-sky-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-base sm:text-lg tracking-tight">StockMeta</span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60">
                  AI Pro
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-slate-500">
                Stock Contributor Metadata Engine
              </p>
            </div>
          </div>
        </div>

        {/* Center: Marketplace Selector Dropdown */}
        <div className="relative">
          <button
            id="marketplace-selector-btn"
            type="button"
            onClick={() => setShowMarketDropdown(!showMarketDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs sm:text-sm font-medium text-slate-800 transition shadow-sm"
          >
            <span className="text-slate-500 hidden sm:inline">Marketplace:</span>
            <span className="font-semibold text-blue-700">{activeMarketplace.name}</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {showMarketDropdown && (
            <div
              id="marketplace-dropdown-menu"
              className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 z-50 text-xs sm:text-sm animate-in fade-in slide-in-from-top-2 duration-150"
            >
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Target Agency Rules</p>
              </div>
              {(Object.keys(MARKETPLACE_CONFIGS) as MarketplaceId[]).map((mId) => {
                const cfg = MARKETPLACE_CONFIGS[mId];
                const isSelected = mId === selectedMarketplace;
                return (
                  <button
                    key={mId}
                    type="button"
                    onClick={() => {
                      onSelectMarketplace(mId);
                      setShowMarketDropdown(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-slate-50 transition ${
                      isSelected ? 'bg-blue-50/60 font-semibold text-blue-700' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <div>{cfg.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Max {cfg.maxTitleLength} chars • {cfg.minKeywords}-{cfg.maxKeywords} tags
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Actions, Install PWA, and Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Online / Offline Pill */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isOnline ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
            title={isOnline ? 'Online - Cloud AI Active' : 'Offline - Local Storage Active'}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-600" /> : <WifiOff className="w-3.5 h-3.5 text-amber-600" />}
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {/* AI Key Mode Pill */}
          <div
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              hasGeminiKey ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
            title={hasGeminiKey ? 'Gemini 3.8 Flash Engine Connected' : 'Demo Mode Active'}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>{hasGeminiKey ? 'Gemini AI Ready' : 'Demo Mode'}</span>
          </div>

          {/* PROMINENT PWA INSTALL BUTTON */}
          {!isInstalled && (
            <>
              {isInstallable && (
                <button
                  id="install-app-btn"
                  type="button"
                  onClick={install}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-indigo-500/20 transition active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Install App</span>
                </button>
              )}

              {isIOS && (
                <button
                  id="install-ios-app-btn"
                  type="button"
                  onClick={() => setShowIOSGuide(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-sm transition"
                >
                  <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                  <span>Install App</span>
                </button>
              )}
            </>
          )}

          {/* Primary CTA: Generate Metadata */}
          <button
            id="primary-generate-metadata-btn"
            type="button"
            onClick={onGenerateMetadataClick}
            disabled={isGenerating || pendingCount === 0}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-md transition ${
              isGenerating
                ? 'bg-blue-400 text-white cursor-wait'
                : pendingCount > 0
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25 active:scale-95'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>
              {isGenerating ? 'Analyzing...' : pendingCount > 0 ? `Generate (${pendingCount})` : 'Generate Metadata'}
            </span>
          </button>
        </div>
      </div>

      {/* iOS Installation Instructions Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Install on iPhone / iPad</h3>
                <p className="text-xs text-slate-500">Run as a standalone offline PWA</p>
              </div>
            </div>
            <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
              <p>
                1. Tap the <strong>Share</strong> button (box with arrow) at the bottom of Safari.
              </p>
              <p>
                2. Scroll down and tap <strong>Add to Home Screen</strong>.
              </p>
              <p>
                3. Tap <strong>Add</strong> in the top right corner.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 w-full rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
