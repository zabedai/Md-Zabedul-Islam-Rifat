import React, { useState, useEffect, useCallback } from 'react';
import { StockImageItem, MarketplaceId } from './types';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { ImageUploader } from './components/ImageUploader';
import { MetadataEditor } from './components/MetadataEditor';
import { BulkGenerator } from './components/BulkGenerator';
import { DashboardOverview } from './components/DashboardOverview';
import { ProjectsView } from './components/ProjectsView';
import { KeywordToolsView } from './components/KeywordToolsView';
import { MetadataCheckerView } from './components/MetadataCheckerView';
import { SettingsView } from './components/SettingsView';
import { analyzeImageMetadata, checkApiStatus } from './services/api';
import {
  getAllImagesFromDB,
  saveImagesToDB,
  deleteImageFromDB,
  clearAllImagesFromDB,
  getSettings
} from './services/db';
import { Wand2, AlertTriangle, CheckCircle2, Sparkles, Layers, RefreshCw } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [selectedMarketplace, setSelectedMarketplace] = useState<MarketplaceId>('adobe-stock');
  const [items, setItems] = useState<StockImageItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 });
  const [hasGeminiKey, setHasGeminiKey] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial API health check
    checkApiStatus().then((st) => {
      setHasGeminiKey(st.hasGeminiKey);
    });

    // Load initial settings and saved items from IndexedDB
    getSettings().then((s) => {
      if (s.defaultMarketplace) setSelectedMarketplace(s.defaultMarketplace);
    });

    getAllImagesFromDB().then((saved) => {
      if (saved && saved.length > 0) {
        setItems(saved);
        setSelectedItemId(saved[0].id);
      }
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save items to IndexedDB whenever items change
  useEffect(() => {
    if (items.length > 0) {
      saveImagesToDB(items);
    }
  }, [items]);

  // Selected item reference
  const activeItem = items.find((i) => i.id === selectedItemId) || items[0] || null;

  // Image Upload Handlers
  const handleImagesAdded = (newItems: StockImageItem[]) => {
    setItems((prev) => {
      const updated = [...newItems, ...prev];
      return updated;
    });
    if (newItems.length > 0 && !selectedItemId) {
      setSelectedItemId(newItems[0].id);
    }
    showToast(`Added ${newItems.length} image(s) to workspace.`);
  };

  const handleRemoveItem = async (id: string) => {
    await deleteImageFromDB(id);
    setItems((prev) => {
      const remaining = prev.filter((i) => i.id !== id);
      if (selectedItemId === id) {
        setSelectedItemId(remaining.length > 0 ? remaining[0].id : null);
      }
      return remaining;
    });
    showToast('Image removed.');
  };

  const handleClearWorkspace = async () => {
    await clearAllImagesFromDB();
    setItems([]);
    setSelectedItemId(null);
    showToast('Workspace cleared.');
  };

  const handleUpdateItem = (updated: StockImageItem) => {
    setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  };

  // AI Generation Handlers
  const handleGenerateSingle = async (itemToProcess: StockImageItem) => {
    setIsGenerating(true);
    // Mark analyzing in UI
    setItems((prev) =>
      prev.map((i) => (i.id === itemToProcess.id ? { ...i, status: 'analyzing' } : i))
    );

    try {
      const metadata = await analyzeImageMetadata(itemToProcess, selectedMarketplace);
      const updatedItem: StockImageItem = {
        ...itemToProcess,
        metadata,
        status: 'completed',
        updatedAt: Date.now()
      };
      handleUpdateItem(updatedItem);
      showToast(`Metadata generated for ${itemToProcess.filename}`);
    } catch (err: any) {
      console.error(err);
      setItems((prev) =>
        prev.map((i) => (i.id === itemToProcess.id ? { ...i, status: 'error' } : i))
      );
      showToast(`Generation failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateBatch = async (itemsToProcess: StockImageItem[]) => {
    if (itemsToProcess.length === 0) return;

    setIsGenerating(true);
    setGenerationProgress({ current: 0, total: itemsToProcess.length });

    // Mark items as analyzing
    const targetIds = new Set(itemsToProcess.map((i) => i.id));
    setItems((prev) =>
      prev.map((i) => (targetIds.has(i.id) ? { ...i, status: 'analyzing' } : i))
    );

    let completedCount = 0;
    for (const item of itemsToProcess) {
      try {
        const metadata = await analyzeImageMetadata(item, selectedMarketplace);
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  metadata,
                  status: 'completed',
                  updatedAt: Date.now()
                }
              : i
          )
        );
      } catch (err) {
        console.error(`Failed generating metadata for ${item.filename}:`, err);
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: 'error' } : i))
        );
      }
      completedCount++;
      setGenerationProgress({ current: completedCount, total: itemsToProcess.length });
    }

    setIsGenerating(false);
    showToast(`Batch completed: ${completedCount} image(s) analyzed.`);
  };

  const handlePrimaryGenerateClick = () => {
    const pending = items.filter((i) => i.status === 'idle' || !i.metadata);
    if (pending.length > 0) {
      handleGenerateBatch(pending);
    } else if (activeItem) {
      handleGenerateSingle(activeItem);
    }
  };

  const pendingCount = items.filter((i) => i.status === 'idle' || !i.metadata).length;
  const completedCount = items.filter((i) => !!i.metadata).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 antialiased">
      {/* Header */}
      <Header
        selectedMarketplace={selectedMarketplace}
        onSelectMarketplace={(m) => {
          setSelectedMarketplace(m);
          showToast(`Marketplace set to ${m}`);
        }}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        isOnline={isOnline}
        hasGeminiKey={hasGeminiKey}
        onGenerateMetadataClick={handlePrimaryGenerateClick}
        isGenerating={isGenerating}
        pendingCount={pendingCount}
      />

      {/* Generation Progress Bar */}
      {isGenerating && generationProgress.total > 0 && (
        <div className="sticky top-[61px] z-20 bg-blue-600 text-white px-4 py-1.5 flex items-center justify-between text-xs font-medium shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 animate-spin text-sky-200" />
            <span>
              Analyzing images with Gemini AI: {generationProgress.current} of {generationProgress.total} completed
            </span>
          </div>
          <span className="font-bold">
            {Math.round((generationProgress.current / generationProgress.total) * 100)}%
          </span>
        </div>
      )}

      {/* Main Container: Sidebar + Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          totalImagesCount={items.length}
          completedCount={completedCount}
        />

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {currentTab === 'dashboard' && (
            <DashboardOverview
              items={items}
              selectedMarketplace={selectedMarketplace}
              onNavigate={(tab) => setCurrentTab(tab)}
              onStartGenerating={handlePrimaryGenerateClick}
              isGenerating={isGenerating}
            />
          )}

          {/* TAB 2: GENERATE METADATA (Upload & Single Editor) */}
          {currentTab === 'generate' && (
            <div className="space-y-6">
              {/* Image Uploader */}
              <ImageUploader
                items={items}
                onImagesAdded={handleImagesAdded}
                onRemoveItem={handleRemoveItem}
                onClearAll={handleClearWorkspace}
                onSelectItem={(id) => setSelectedItemId(id)}
                selectedItemId={selectedItemId}
              />

              {/* Single Image Metadata Editor */}
              {activeItem ? (
                <MetadataEditor
                  key={activeItem.id}
                  item={activeItem}
                  marketplaceId={selectedMarketplace}
                  onUpdateItem={handleUpdateItem}
                  onRegenerate={handleGenerateSingle}
                  isGenerating={isGenerating && activeItem.status === 'analyzing'}
                />
              ) : items.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
                  <Wand2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <h3 className="font-semibold text-slate-800 text-sm">No image selected</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Upload an image or click "Load 3 Demo Photos" above to start generating metadata.
                  </p>
                </div>
              ) : null}
            </div>
          )}

          {/* TAB 3: BULK GENERATOR */}
          {currentTab === 'bulk' && (
            <div className="space-y-6">
              <BulkGenerator
                items={items}
                selectedMarketplace={selectedMarketplace}
                onEditItem={(id) => {
                  setSelectedItemId(id);
                  setCurrentTab('generate');
                }}
                onRegenerateItem={handleGenerateSingle}
                onDeleteItem={handleRemoveItem}
                onGenerateBatch={handleGenerateBatch}
                isGenerating={isGenerating}
              />
            </div>
          )}

          {/* TAB 4: PROJECTS */}
          {currentTab === 'projects' && (
            <ProjectsView
              currentItems={items}
              selectedMarketplace={selectedMarketplace}
              onLoadProject={(loadedItems, market) => {
                setItems(loadedItems);
                if (loadedItems.length > 0) setSelectedItemId(loadedItems[0].id);
                setSelectedMarketplace(market);
                setCurrentTab('bulk');
                showToast(`Loaded ${loadedItems.length} images from saved project.`);
              }}
            />
          )}

          {/* TAB 5: KEYWORD TOOLS */}
          {currentTab === 'keywords' && <KeywordToolsView />}

          {/* TAB 6: METADATA CHECKER */}
          {currentTab === 'checker' && <MetadataCheckerView />}

          {/* TAB 7: SETTINGS */}
          {currentTab === 'settings' && (
            <SettingsView
              hasGeminiKey={hasGeminiKey}
              onClearWorkspace={handleClearWorkspace}
            />
          )}
        </main>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-medium flex items-center gap-2 border border-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
