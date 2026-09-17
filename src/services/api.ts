import { StockImageItem, StockMetadata, MarketplaceId } from '../types';
import { auditMetadata } from './qualityScorer';

export interface ApiStatus {
  status: string;
  hasGeminiKey: boolean;
  mode: 'live' | 'demo';
  timestamp: number;
}

export async function checkApiStatus(): Promise<ApiStatus> {
  try {
    const res = await fetch('/api/status');
    if (!res.ok) throw new Error('Status check failed');
    return await res.json();
  } catch {
    return {
      status: 'offline',
      hasGeminiKey: false,
      mode: 'demo',
      timestamp: Date.now()
    };
  }
}

/**
 * Compresses/resizes a high-res image before sending to API to ensure fast, reliable Gemini analysis
 */
export async function optimizeImageForAnalysis(dataUrl: string, maxDimension = 1600): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
        resolve({
          base64: optimizedDataUrl.replace(/^data:image\/jpeg;base64,/, ''),
          mimeType: 'image/jpeg'
        });
        return;
      }
      // Fallback
      resolve({
        base64: dataUrl.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, ''),
        mimeType: 'image/jpeg'
      });
    };
    img.onerror = () => {
      resolve({
        base64: dataUrl.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, ''),
        mimeType: 'image/jpeg'
      });
    };
    img.src = dataUrl;
  });
}

/**
 * Calls backend API to analyze image and generate metadata
 */
export async function analyzeImageMetadata(
  item: StockImageItem,
  marketplace: MarketplaceId = 'adobe-stock'
): Promise<StockMetadata> {
  const { base64, mimeType } = await optimizeImageForAnalysis(item.previewUrl);

  const response = await fetch('/api/generate-metadata', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageBase64: base64,
      mimeType,
      filename: item.filename,
      marketplace
    })
  });

  if (!response.ok) {
    throw new Error(`Analysis failed with HTTP status ${response.status}`);
  }

  const raw = await response.json();

  const metadata: StockMetadata = {
    title: raw.title || item.filename.replace(/\.[^/.]+$/, ''),
    description: raw.description || '',
    keywords: Array.isArray(raw.keywords) ? raw.keywords : [],
    primaryKeywords: Array.isArray(raw.primaryKeywords) ? raw.primaryKeywords : [],
    secondaryKeywords: Array.isArray(raw.secondaryKeywords) ? raw.secondaryKeywords : [],
    category: raw.category || 'Lifestyle',
    contentType: raw.contentType || 'Photo',
    commercialEditorial: raw.commercialEditorial === 'Editorial' ? 'Editorial' : 'Commercial',
    commercialReason: raw.commercialReason || ''
  };

  // Run deterministic audit scoring
  metadata.qualityAudit = auditMetadata(metadata, marketplace);

  return metadata;
}

export async function requestKeywordSuggestions(
  title: string,
  description: string,
  currentKeywords: string[]
): Promise<string[]> {
  try {
    const res = await fetch('/api/suggest-keywords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, currentKeywords })
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.suggestions || [];
  } catch {
    return [];
  }
}
