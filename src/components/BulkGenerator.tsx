import React, { useState } from 'react';
import { StockImageItem, MarketplaceId } from '../types';
import { MARKETPLACE_CONFIGS } from '../services/marketplaceRules';
import { QualityScoreBadge } from './QualityScoreBadge';
import { downloadCSV, downloadXLSX, downloadTXT, copyMetadataToClipboard } from '../services/exporter';
import {
  Sparkles,
  Download,
  Copy,
  Check,
  Trash2,
  Edit3,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Layers,
  CheckSquare,
  Square,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface Props {
  items: StockImageItem[];
  selectedMarketplace: MarketplaceId;
  onEditItem: (id: string) => void;
  onRegenerateItem: (item: StockImageItem) => void;
  onDeleteItem: (id: string) => void;
  onGenerateBatch: (items: StockImageItem[]) => void;
  isGenerating: boolean;
}

export const BulkGenerator: React.FC<Props> = ({
  items,
  selectedMarketplace,
  onEditItem,
  onRegenerateItem,
  onDeleteItem,
  onGenerateBatch,
  isGenerating
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedBatch, setCopiedBatch] = useState(false);

  const config = MARKETPLACE_CONFIGS[selectedMarketplace] || MARKETPLACE_CONFIGS['adobe-stock'];

  const allSelected = items.length > 0 && selectedIds.size === items.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const selectedItems = items.filter((i) => selectedIds.has(i.id));
  const activeItemsToExport = selectedItems.length > 0 ? selectedItems : items;

  const handleCopySingle = async (item: StockImageItem) => {
    await copyMetadataToClipboard([item]);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleCopyBatch = async () => {
    await copyMetadataToClipboard(activeItemsToExport);
    setCopiedBatch(true);
    setTimeout(() => setCopiedBatch(false), 1800);
  };

  const pendingGenerationItems = (selectedItems.length > 0 ? selectedItems : items).filter(
    (i) => i.status === 'idle' || !i.metadata
  );

  return (
    <div id="bulk-generator-view" className="space-y-4">
      {/* Action Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition"
          >
            {allSelected ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-slate-400" />}
            <span>{allSelected ? 'Deselect All' : 'Select All'}</span>
          </button>

          <span className="text-xs text-slate-500">
            {selectedIds.size > 0 ? `${selectedIds.size} of ${items.length} selected` : `All ${items.length} images`}
          </span>

          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.badgeColor}`}>
            Target: {config.name}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={isGenerating || pendingGenerationItems.length === 0}
            onClick={() => onGenerateBatch(pendingGenerationItems)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition ${
              isGenerating || pendingGenerationItems.length === 0
                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-95'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>Generate Selected ({pendingGenerationItems.length})</span>
          </button>

          <button
            type="button"
            onClick={handleCopyBatch}
            disabled={activeItemsToExport.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
          >
            {copiedBatch ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy Metadata</span>
          </button>

          {/* Export Dropdown / Group */}
          <div className="flex items-center rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xs">
            <button
              type="button"
              onClick={() => downloadCSV(activeItemsToExport, selectedMarketplace)}
              className="px-3 py-2 hover:bg-slate-800 rounded-l-xl flex items-center gap-1.5"
              title="Download standard stock CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              type="button"
              onClick={() => downloadXLSX(activeItemsToExport, selectedMarketplace)}
              className="px-2.5 py-2 border-l border-slate-800 hover:bg-slate-800"
              title="Download Excel spreadsheet"
            >
              XLSX
            </button>
            <button
              type="button"
              onClick={() => downloadTXT(activeItemsToExport)}
              className="px-2.5 py-2 border-l border-slate-800 hover:bg-slate-800 rounded-r-xl"
              title="Download Text format"
            >
              TXT
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {items.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <Layers className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-medium">No images uploaded to the batch yet.</p>
            <p className="text-xs text-slate-400">Upload or drag JPG/PNG files in the Generate tab to begin.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="py-3 px-4 w-20">Preview</th>
                  <th className="py-3 px-4 min-w-[160px]">Filename</th>
                  <th className="py-3 px-4 min-w-[240px]">Title</th>
                  <th className="py-3 px-4 min-w-[200px]">Keywords</th>
                  <th className="py-3 px-4 min-w-[120px]">Category</th>
                  <th className="py-3 px-4 min-w-[100px]">Quality</th>
                  <th className="py-3 px-4 min-w-[110px]">Status</th>
                  <th className="py-3 px-4 text-right min-w-[140px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {items.map((item) => {
                  const isChecked = selectedIds.has(item.id);
                  const isAnalyzing = item.status === 'analyzing';
                  const meta = item.metadata;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isChecked ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOne(item.id)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                      </td>

                      {/* Preview Thumbnail */}
                      <td className="py-3 px-4">
                        <div
                          className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer"
                          onClick={() => onEditItem(item.id)}
                        >
                          <img
                            src={item.previewUrl}
                            alt={item.filename}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>

                      {/* Filename */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 truncate max-w-[180px]" title={item.filename}>
                          {item.filename}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {meta?.contentType || 'Photo'} • {meta?.commercialEditorial || 'Commercial'}
                        </div>
                      </td>

                      {/* Title */}
                      <td className="py-3 px-4">
                        {meta?.title ? (
                          <p className="text-slate-800 line-clamp-2" title={meta.title}>
                            {meta.title}
                          </p>
                        ) : (
                          <span className="text-slate-400 italic">Not generated yet</span>
                        )}
                      </td>

                      {/* Keywords */}
                      <td className="py-3 px-4">
                        {meta?.keywords && meta.keywords.length > 0 ? (
                          <div>
                            <span className="font-bold text-blue-600">{meta.keywords.length} tags: </span>
                            <span className="text-slate-600 line-clamp-2">
                              {meta.keywords.slice(0, 8).join(', ')}
                              {meta.keywords.length > 8 ? '...' : ''}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No tags</span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {meta?.category || '-'}
                        </span>
                      </td>

                      {/* Quality Score */}
                      <td className="py-3 px-4">
                        {meta?.qualityAudit ? (
                          <QualityScoreBadge audit={meta.qualityAudit} compact />
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {isAnalyzing ? (
                          <span className="inline-flex items-center gap-1 text-blue-600 font-semibold text-[11px]">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Analyzing
                          </span>
                        ) : meta ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                            Completed
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Ready</span>
                        )}
                      </td>

                      {/* Row Actions: Edit, Regenerate, Copy, Delete */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onEditItem(item.id)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit metadata"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            disabled={isGenerating}
                            onClick={() => onRegenerateItem(item)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Regenerate with AI"
                          >
                            <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopySingle(item)}
                            className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            title="Copy metadata"
                          >
                            {copiedId === item.id ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteItem(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
