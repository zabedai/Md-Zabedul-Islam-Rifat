import React, { useState, useEffect } from 'react';
import { ProjectBatch, StockImageItem, MarketplaceId } from '../types';
import { getAllProjectsFromDB, saveProjectBatch, deleteProjectFromDB } from '../services/db';
import { MARKETPLACE_CONFIGS } from '../services/marketplaceRules';
import { downloadCSV, downloadXLSX } from '../services/exporter';
import {
  FolderKanban,
  Save,
  Trash2,
  ExternalLink,
  Download,
  Clock,
  CheckCircle2,
  Calendar,
  Layers
} from 'lucide-react';

interface Props {
  currentItems: StockImageItem[];
  selectedMarketplace: MarketplaceId;
  onLoadProject: (items: StockImageItem[], marketplace: MarketplaceId) => void;
}

export const ProjectsView: React.FC<Props> = ({
  currentItems,
  selectedMarketplace,
  onLoadProject
}) => {
  const [projects, setProjects] = useState<ProjectBatch[]>([]);
  const [projectName, setProjectName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadProjects = async () => {
    const list = await getAllProjectsFromDB();
    setProjects(list);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleSaveCurrentBatch = async () => {
    if (currentItems.length === 0) {
      alert('No images in active workspace to save.');
      return;
    }

    const name = projectName.trim() || `Batch ${new Date().toLocaleDateString()} (${currentItems.length} images)`;
    setIsSaving(true);
    try {
      const newBatch: ProjectBatch = {
        id: `proj_${Date.now()}`,
        name,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        targetMarketplace: selectedMarketplace,
        items: currentItems
      };
      await saveProjectBatch(newBatch);
      setProjectName('');
      await loadProjects();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this saved project batch?')) {
      await deleteProjectFromDB(id);
      await loadProjects();
    }
  };

  return (
    <div id="projects-view" className="space-y-6">
      {/* Save Active Batch Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Save className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Save Active Workspace to Projects</h3>
            <p className="text-xs text-slate-500">
              Save your current {currentItems.length} images and generated metadata to local offline storage.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder={`e.g. Summer Coffee Shoot (${currentItems.length} images)`}
            className="w-full sm:flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <button
            type="button"
            disabled={isSaving || currentItems.length === 0}
            onClick={handleSaveCurrentBatch}
            className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm shadow-sm transition ${
              currentItems.length > 0
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-95'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save Current Batch'}
          </button>
        </div>
      </div>

      {/* Saved Projects Library */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">Saved Projects Library</h3>
          </div>
          <span className="text-xs text-slate-400">{projects.length} saved batches</span>
        </div>

        {projects.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Layers className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs font-medium">No saved projects yet.</p>
            <p className="text-[11px]">Save your first batch above to access it across browser sessions.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {projects.map((proj) => {
              const market = MARKETPLACE_CONFIGS[proj.targetMarketplace] || MARKETPLACE_CONFIGS['adobe-stock'];
              const completedCount = proj.items.filter((i) => !!i.metadata).length;

              return (
                <div
                  key={proj.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-300 hover:shadow-xs transition space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{proj.name}</h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(proj.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className={`px-1.5 py-0.2 rounded border ${market.badgeColor}`}>
                          {market.name}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(proj.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition"
                      title="Delete project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Thumbnail previews */}
                  <div className="flex items-center gap-1.5 overflow-hidden py-1">
                    {proj.items.slice(0, 5).map((img, idx) => (
                      <div
                        key={idx}
                        className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0"
                      >
                        <img
                          src={img.previewUrl}
                          alt={img.filename}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    {proj.items.length > 5 && (
                      <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 font-bold text-[11px] flex items-center justify-center shrink-0">
                        +{proj.items.length - 5}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <span className="text-slate-500">
                      {proj.items.length} images ({completedCount} completed)
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => downloadCSV(proj.items, proj.targetMarketplace, proj.name.replace(/\s+/g, '-'))}
                        className="p-1 text-slate-600 hover:text-blue-600"
                        title="Download CSV"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onLoadProject(proj.items, proj.targetMarketplace)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold text-xs px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 transition"
                      >
                        <span>Load Batch</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
