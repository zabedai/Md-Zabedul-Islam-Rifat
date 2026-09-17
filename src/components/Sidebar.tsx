import React from 'react';
import {
  LayoutDashboard,
  Wand2,
  Layers,
  FolderKanban,
  Tag,
  CheckCircle,
  Settings,
  Sparkles,
  X,
  Image as ImageIcon
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'generate'
  | 'bulk'
  | 'projects'
  | 'keywords'
  | 'checker'
  | 'settings';

interface Props {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  totalImagesCount: number;
  completedCount: number;
}

export const Sidebar: React.FC<Props> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  totalImagesCount,
  completedCount
}) => {
  const navItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }>; badge?: string | number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'generate',
      label: 'Generate Metadata',
      icon: Wand2,
      badge: totalImagesCount > 0 ? totalImagesCount : undefined
    },
    {
      id: 'bulk',
      label: 'Bulk Generator',
      icon: Layers,
      badge: completedCount > 0 ? `${completedCount} Ready` : undefined
    },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'keywords', label: 'Keyword Tools', icon: Tag },
    { id: 'checker', label: 'Metadata Checker', icon: CheckCircle },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 md:hidden backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        id="app-sidebar"
        className={`fixed md:sticky top-0 md:top-[61px] left-0 z-40 md:z-20 h-screen md:h-[calc(100vh-61px)] w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 space-y-6 overflow-y-auto">
          {/* Mobile close button */}
          <div className="flex items-center justify-between md:hidden pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                SM
              </div>
              <span className="font-bold text-slate-800">StockMeta</span>
            </div>
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Navigation
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  type="button"
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-blue-50 text-blue-700 border border-blue-200/50'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Workspace Quick Summary Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="font-medium flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                Active Batch
              </span>
              <span className="font-bold text-slate-900">{totalImagesCount} images</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-300"
                style={{
                  width: `${totalImagesCount > 0 ? Math.round((completedCount / totalImagesCount) * 100) : 0}%`
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>{completedCount} completed</span>
              <span>{totalImagesCount - completedCount} pending</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs">
              SC
            </div>
            <div className="text-left overflow-hidden">
              <p className="text-xs font-semibold text-slate-800 truncate">Stock Contributor</p>
              <p className="text-[10px] text-slate-400">Offline PWA Enabled</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
