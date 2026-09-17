export type MarketplaceId =
  | 'adobe-stock'
  | 'shutterstock'
  | 'vecteezy'
  | 'freepik'
  | 'istock'
  | 'dreamstime'
  | 'generic';

export type ContentType = 'Photo' | 'Illustration' | 'Vector' | '3D Render' | 'AI-Generated';

export type CommercialType = 'Commercial' | 'Editorial';

export type ImageStatus = 'idle' | 'analyzing' | 'completed' | 'error';

export interface QualityMetric {
  name: string;
  score: number; // 0 to 100
  weight: number;
  message: string;
  passed: boolean;
}

export interface QualityAudit {
  overallScore: number; // 0 to 100
  titleScore: number;
  descriptionScore: number;
  keywordScore: number;
  keywordCount: number;
  duplicates: string[];
  missingSuggestions: string[];
  metrics: QualityMetric[];
  status: 'Stock Ready' | 'Needs Polish' | 'Needs Attention';
}

export interface StockMetadata {
  title: string;
  description: string;
  keywords: string[];
  primaryKeywords: string[];
  secondaryKeywords: string[];
  category: string;
  contentType: ContentType;
  commercialEditorial: CommercialType;
  commercialReason?: string;
  qualityAudit?: QualityAudit;
}

export interface StockImageItem {
  id: string;
  filename: string;
  fileSize: number;
  fileType: string;
  width?: number;
  height?: number;
  previewUrl: string; // Base64 data URL or Object URL
  status: ImageStatus;
  progress?: number;
  errorMessage?: string;
  metadata?: StockMetadata;
  createdAt: number;
  updatedAt: number;
}

export interface MarketplaceConfig {
  id: MarketplaceId;
  name: string;
  badgeColor: string;
  maxTitleLength: number;
  minTitleLength: number;
  recommendedKeywordsCount: [number, number]; // e.g. [25, 45]
  maxKeywords: number;
  minKeywords: number;
  supportsCategories: boolean;
  categories: string[];
  guidelines: string[];
}

export interface UserSettings {
  defaultMarketplace: MarketplaceId;
  defaultContentType: ContentType;
  autoAnalyzeOnUpload: boolean;
  targetKeywordCount: number;
  exportEncoding: 'utf-8' | 'utf-8-bom';
  includeCommercialInTitle: boolean;
}

export interface ProjectBatch {
  id: string;
  name: string;
  createdAt: number;
  updatedAt?: number;
  targetMarketplace: MarketplaceId;
  itemCount?: number;
  items: StockImageItem[];
}
