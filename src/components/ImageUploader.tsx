import React, { useRef, useState } from 'react';
import { StockImageItem } from '../types';
import { UploadCloud, Image as ImageIcon, Trash2, CheckCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react';

interface Props {
  onImagesAdded: (items: StockImageItem[]) => void;
  items: StockImageItem[];
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
  onSelectItem?: (id: string) => void;
  selectedItemId?: string | null;
}

// Preset samples for instantaneous test drive
const SAMPLE_IMAGES = [
  {
    name: 'artisan-coffee-latte-wooden-table.jpg',
    url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop&q=80',
    type: 'image/jpeg'
  },
  {
    name: 'modern-coworking-office-meeting.jpg',
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
    type: 'image/jpeg'
  },
  {
    name: 'alpine-mountain-lake-sunrise.jpg',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80',
    type: 'image/jpeg'
  }
];

export const ImageUploader: React.FC<Props> = ({
  onImagesAdded,
  items,
  onRemoveItem,
  onClearAll,
  onSelectItem,
  selectedItemId
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);

  const processFiles = (files: FileList | File[]) => {
    const validExtensions = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const newItems: StockImageItem[] = [];

    Array.from(files).forEach((file) => {
      if (!validExtensions.includes(file.type.toLowerCase())) {
        alert(`File "${file.name}" is not a supported format. Please upload JPG or PNG.`);
        return;
      }

      if (file.size > 25 * 1024 * 1024) {
        alert(`File "${file.name}" is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max 25MB.`);
        return;
      }

      const reader = new FileReader();
      const tempId = `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      reader.onload = (e) => {
        const previewUrl = e.target?.result as string;
        const imgObj: StockImageItem = {
          id: tempId,
          filename: file.name,
          fileSize: file.size,
          fileType: file.type,
          previewUrl,
          status: 'idle',
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        onImagesAdded([imgObj]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = ''; // reset so same file can be re-uploaded if desired
    }
  };

  const loadSampleImages = async () => {
    setLoadingSample(true);
    try {
      const added: StockImageItem[] = [];
      for (const sample of SAMPLE_IMAGES) {
        // Fetch and convert sample to base64
        const resp = await fetch(sample.url);
        const blob = await resp.blob();
        const reader = new FileReader();
        await new Promise<void>((resolve) => {
          reader.onload = () => {
            added.push({
              id: `sample_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              filename: sample.name,
              fileSize: blob.size,
              fileType: sample.type,
              previewUrl: reader.result as string,
              status: 'idle',
              createdAt: Date.now(),
              updatedAt: Date.now()
            });
            resolve();
          };
          reader.readAsDataURL(blob);
        });
      }
      onImagesAdded(added);
    } catch (err) {
      console.warn('Could not load sample images:', err);
    } finally {
      setLoadingSample(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div id="image-upload-section" className="space-y-4">
      {/* Drag and Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-150 ${
          isDragging
            ? 'border-blue-500 bg-blue-50/70 scale-[0.99]'
            : 'border-slate-300 hover:border-blue-400 bg-white hover:bg-slate-50/50 shadow-xs'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
            <UploadCloud className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-800">
              Drag and drop your stock images here
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Supports <strong className="text-slate-700">JPG, JPEG, PNG</strong> up to 25MB each. Batch upload supported.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Browse Files
            </button>

            <button
              type="button"
              disabled={loadingSample}
              onClick={(e) => {
                e.stopPropagation();
                loadSampleImages();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
            >
              {loadingSample ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              )}
              <span>Load 3 Demo Photos</span>
            </button>
          </div>
        </div>
      </div>

      {/* Uploaded Files Strip */}
      {items.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Uploaded Images ({items.length})
              </span>
              <span className="text-xs text-slate-400">
                Click any thumbnail to inspect or edit
              </span>
            </div>

            <button
              type="button"
              onClick={onClearAll}
              className="text-xs font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1 hover:bg-rose-50 px-2 py-1 rounded-lg transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All
            </button>
          </div>

          {/* Grid of thumbnails */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {items.map((item) => {
              const isSelected = selectedItemId === item.id;
              const hasMetadata = !!item.metadata;
              const isAnalyzing = item.status === 'analyzing';

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectItem && onSelectItem(item.id)}
                  className={`group relative rounded-xl border p-2 cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-slate-100">
                    <img
                      src={item.previewUrl}
                      alt={item.filename}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />

                    {/* Status Pill Badge */}
                    <div className="absolute top-1.5 left-1.5">
                      {isAnalyzing ? (
                        <span className="px-1.5 py-0.5 rounded-md bg-blue-600/90 text-white text-[10px] font-semibold flex items-center gap-1 shadow-sm">
                          <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          AI
                        </span>
                      ) : hasMetadata ? (
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-600/90 text-white text-[10px] font-semibold flex items-center gap-1 shadow-sm">
                          <CheckCircle className="w-2.5 h-2.5" />
                          {item.metadata?.qualityAudit?.overallScore || 'Done'}
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-900/60 text-white text-[10px] font-medium backdrop-blur-xs">
                          Ready
                        </span>
                      )}
                    </div>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveItem(item.id);
                      }}
                      className="absolute top-1.5 right-1.5 p-1 rounded-md bg-slate-900/70 hover:bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition shadow-sm"
                      title="Remove image"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="mt-1.5 px-0.5">
                    <p className="text-[11px] font-medium text-slate-800 truncate" title={item.filename}>
                      {item.filename}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                      <span>{formatBytes(item.fileSize)}</span>
                      {hasMetadata && (
                        <span className="text-blue-600 font-semibold">
                          {item.metadata?.keywords?.length || 0} tags
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
