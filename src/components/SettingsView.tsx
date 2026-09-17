import React, { useState, useEffect } from 'react';
import { UserSettings, MarketplaceId, ContentType } from '../types';
import { MARKETPLACE_CONFIGS } from '../services/marketplaceRules';
import { getSettings, saveSettings, clearAllImagesFromDB } from '../services/db';
import { Settings, ShieldCheck, Check, Database, Sparkles, AlertTriangle } from 'lucide-react';

interface Props {
  hasGeminiKey: boolean;
  onClearWorkspace: () => void;
}

export const SettingsView: React.FC<Props> = ({ hasGeminiKey, onClearWorkspace }) => {
  const [settings, setSettings] = useState<UserSettings>({
    defaultMarketplace: 'adobe-stock',
    defaultContentType: 'Photo',
    autoAnalyzeOnUpload: false,
    targetKeywordCount: 35,
    exportEncoding: 'utf-8-bom',
    includeCommercialInTitle: false
  });
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const handleChange = (key: keyof UserSettings, value: any) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    saveSettings(updated).then(() => {
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2000);
    });
  };

  const handleClearIndexedDB = async () => {
    if (confirm('Clear all stored images and caches from this device?')) {
      await clearAllImagesFromDB();
      onClearWorkspace();
      alert('Local storage cleared.');
    }
  };

  return (
    <div id="settings-view" className="space-y-6 max-w-4xl">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Application Preferences</h2>
              <p className="text-xs text-slate-500">Configure default agency guidelines and export behavior.</p>
            </div>
          </div>

          {savedNotice && (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <Check className="w-3.5 h-3.5" />
              Settings Saved
            </span>
          )}
        </div>

        {/* Agency Preferences */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Agency & Generation Defaults</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Default Target Marketplace
              </label>
              <select
                value={settings.defaultMarketplace}
                onChange={(e) => handleChange('defaultMarketplace', e.target.value as MarketplaceId)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {(Object.keys(MARKETPLACE_CONFIGS) as MarketplaceId[]).map((mId) => (
                  <option key={mId} value={mId}>
                    {MARKETPLACE_CONFIGS[mId].name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Default Content Type
              </label>
              <select
                value={settings.defaultContentType}
                onChange={(e) => handleChange('defaultContentType', e.target.value as ContentType)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Photo">Photo</option>
                <option value="Illustration">Illustration</option>
                <option value="Vector">Vector</option>
                <option value="3D Render">3D Render</option>
                <option value="AI-Generated">AI-Generated</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Target Keyword Tag Count ({settings.targetKeywordCount})
              </label>
              <input
                type="range"
                min="20"
                max="49"
                value={settings.targetKeywordCount}
                onChange={(e) => handleChange('targetKeywordCount', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>20 tags</span>
                <span>35 tags (Sweet spot)</span>
                <span>49 tags (Max)</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                CSV Export Encoding
              </label>
              <select
                value={settings.exportEncoding}
                onChange={(e) => handleChange('exportEncoding', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="utf-8-bom">UTF-8 with BOM (Recommended for Excel)</option>
                <option value="utf-8">Standard UTF-8</option>
              </select>
            </div>
          </div>
        </div>

        {/* Gemini API Security Architecture */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            AI Engine & Server Security
          </h3>

          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-blue-900">
                  {hasGeminiKey ? 'Gemini 3.8 Flash Engine Connected' : 'Demo Mode Active'}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-white text-blue-700 border border-blue-200">
                  Server-Side Protected
                </span>
              </div>
              <p className="text-blue-800/80 leading-relaxed">
                All image analysis and multimodal token generation run on the backend Express server via the official{' '}
                <code>@google/genai</code> SDK. Your API keys are strictly guarded server-side and never exposed to the client browser.
              </p>
            </div>
          </div>
        </div>

        {/* Local Storage Controls */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-800">Clear Local Workspace Storage</h4>
            <p className="text-[11px] text-slate-500">
              Purges cached base64 thumbnails and working memory from IndexedDB.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearIndexedDB}
            className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition"
          >
            Clear Database
          </button>
        </div>
      </div>
    </div>
  );
};
