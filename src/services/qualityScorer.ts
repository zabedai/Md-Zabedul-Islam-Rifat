import { MarketplaceId, QualityAudit, QualityMetric, StockMetadata } from '../types';
import { MARKETPLACE_CONFIGS } from './marketplaceRules';

const SPAM_WORDS = [
  'best',
  'amazing',
  'stunning',
  'breathtaking',
  'awesome',
  'download',
  'free',
  'cheap',
  'buy',
  'sale',
  'top quality',
  'high resolution',
  '4k wallpaper',
  'masterpiece',
  'viral',
  'click here',
  'superb'
];

export function auditMetadata(metadata: StockMetadata, marketplaceId: MarketplaceId = 'adobe-stock'): QualityAudit {
  const config = MARKETPLACE_CONFIGS[marketplaceId] || MARKETPLACE_CONFIGS['adobe-stock'];
  const metrics: QualityMetric[] = [];
  const duplicates: string[] = [];
  const missingSuggestions: string[] = [];

  const title = (metadata.title || '').trim();
  const description = (metadata.description || '').trim();
  const keywords = (metadata.keywords || []).map((k) => k.trim()).filter(Boolean);

  // 1. TITLE AUDIT
  let titleScore = 100;
  const titleWords = title.split(/\s+/).filter(Boolean);

  if (!title) {
    titleScore = 0;
    metrics.push({
      name: 'Title Presence',
      score: 0,
      weight: 15,
      message: 'Title is missing.',
      passed: false
    });
  } else {
    // Length check
    if (title.length < config.minTitleLength) {
      titleScore -= 30;
      metrics.push({
        name: 'Title Length',
        score: 60,
        weight: 10,
        message: `Title is too brief (${title.length} chars). Minimum recommended is ${config.minTitleLength} characters.`,
        passed: false
      });
    } else if (title.length > config.maxTitleLength) {
      titleScore -= 40;
      metrics.push({
        name: 'Title Length',
        score: 40,
        weight: 10,
        message: `Title exceeds ${config.name} limit (${title.length}/${config.maxTitleLength} chars).`,
        passed: false
      });
    } else if (title.length >= 35 && title.length <= 100) {
      metrics.push({
        name: 'Title Length',
        score: 100,
        weight: 10,
        message: `Optimal title length (${title.length} chars) for search indexing.`,
        passed: true
      });
    } else {
      metrics.push({
        name: 'Title Length',
        score: 85,
        weight: 10,
        message: `Acceptable title length (${title.length} chars).`,
        passed: true
      });
    }

    // Check ALL CAPS or all lowercase
    if (title.length > 5 && title === title.toUpperCase()) {
      titleScore -= 30;
      metrics.push({
        name: 'Title Capitalization',
        score: 40,
        weight: 5,
        message: 'Avoid ALL CAPS in title. Stock reviewers often reject this.',
        passed: false
      });
    }

    // Check spam words
    const foundTitleSpam = SPAM_WORDS.filter((word) =>
      new RegExp(`\\b${word}\\b`, 'i').test(title)
    );
    if (foundTitleSpam.length > 0) {
      titleScore -= foundTitleSpam.length * 20;
      metrics.push({
        name: 'Promotional Language',
        score: 30,
        weight: 10,
        message: `Avoid promotional keywords like "${foundTitleSpam.join(', ')}". Describe only visible facts.`,
        passed: false
      });
    } else {
      metrics.push({
        name: 'Professional Tone',
        score: 100,
        weight: 5,
        message: 'Free of promotional buzzwords and clickbait.',
        passed: true
      });
    }
  }
  titleScore = Math.max(0, Math.min(100, titleScore));

  // 2. DESCRIPTION AUDIT
  let descScore = 100;
  const descWords = description.split(/\s+/).filter(Boolean);

  if (!description) {
    descScore = 10;
    metrics.push({
      name: 'Description Presence',
      score: 10,
      weight: 15,
      message: 'Description is missing or empty.',
      passed: false
    });
  } else {
    if (descWords.length < 6) {
      descScore -= 35;
      metrics.push({
        name: 'Description Depth',
        score: 50,
        weight: 10,
        message: 'Description is very brief. Expand with setting, subject details, or context.',
        passed: false
      });
    } else if (descWords.length >= 10 && descWords.length <= 45) {
      metrics.push({
        name: 'Description Depth',
        score: 100,
        weight: 10,
        message: `Good descriptive depth (${descWords.length} words).`,
        passed: true
      });
    }

    // Check description spam
    const foundDescSpam = SPAM_WORDS.filter((word) =>
      new RegExp(`\\b${word}\\b`, 'i').test(description)
    );
    if (foundDescSpam.length > 0) {
      descScore -= 25;
      metrics.push({
        name: 'Description Authenticity',
        score: 40,
        weight: 5,
        message: `Contains subjective terms ("${foundDescSpam.join(', ')}").`,
        passed: false
      });
    }
  }
  descScore = Math.max(0, Math.min(100, descScore));

  // 3. KEYWORDS & DUPLICATES AUDIT
  let keywordScore = 100;
  const seenLower = new Map<string, number>();

  keywords.forEach((kw) => {
    const lower = kw.toLowerCase().trim();
    seenLower.set(lower, (seenLower.get(lower) || 0) + 1);
  });

  seenLower.forEach((count, key) => {
    if (count > 1) {
      duplicates.push(key);
    }
  });

  if (duplicates.length > 0) {
    keywordScore -= duplicates.length * 10;
    metrics.push({
      name: 'Duplicate Keywords',
      score: Math.max(20, 100 - duplicates.length * 20),
      weight: 15,
      message: `Found ${duplicates.length} duplicate keyword(s): "${duplicates.slice(0, 3).join('", "')}". Remove duplicates to save tag slots.`,
      passed: false
    });
  } else {
    metrics.push({
      name: 'Keyword Uniqueness',
      score: 100,
      weight: 10,
      message: 'Zero duplicate keywords detected.',
      passed: true
    });
  }

  // Keyword Count
  const count = keywords.length;
  const [recMin, recMax] = config.recommendedKeywordsCount;

  if (count < config.minKeywords) {
    keywordScore -= 50;
    metrics.push({
      name: 'Keyword Quantity',
      score: 30,
      weight: 20,
      message: `Only ${count} keywords provided. ${config.name} requires at least ${config.minKeywords}.`,
      passed: false
    });
  } else if (count > config.maxKeywords) {
    keywordScore -= 35;
    metrics.push({
      name: 'Keyword Quantity',
      score: 50,
      weight: 15,
      message: `Total ${count} keywords exceeds marketplace limit of ${config.maxKeywords}.`,
      passed: false
    });
  } else if (count >= recMin && count <= recMax) {
    metrics.push({
      name: 'Keyword Quantity',
      score: 100,
      weight: 15,
      message: `Optimal keyword count (${count} tags) within recommended ${recMin}-${recMax} sweet spot.`,
      passed: true
    });
  } else {
    metrics.push({
      name: 'Keyword Quantity',
      score: 80,
      weight: 15,
      message: `${count} keywords is acceptable (recommended: ${recMin}-${recMax}).`,
      passed: true
    });
  }

  // Check synergy between Title and Keywords
  const titleTokens = title.toLowerCase().split(/[^a-z0-9]+/i).filter((t) => t.length > 3);
  const matchedTokens = titleTokens.filter((t) =>
    keywords.some((kw) => kw.toLowerCase().includes(t))
  );

  if (titleTokens.length > 0 && matchedTokens.length >= Math.min(2, titleTokens.length)) {
    metrics.push({
      name: 'Title-Keyword Alignment',
      score: 100,
      weight: 10,
      message: 'Key subjects in the title match your top keywords for search synergy.',
      passed: true
    });
  } else {
    keywordScore -= 10;
    missingSuggestions.push('Include main subject keywords directly into the title.');
    metrics.push({
      name: 'Title-Keyword Alignment',
      score: 65,
      weight: 5,
      message: 'Consider aligning title terms with your primary keywords.',
      passed: false
    });
  }

  // Check generic vs specific
  const tooShortTags = keywords.filter((k) => k.length <= 2);
  if (tooShortTags.length > 0) {
    keywordScore -= tooShortTags.length * 5;
    metrics.push({
      name: 'Keyword Specificity',
      score: 60,
      weight: 5,
      message: `Very short tags found ("${tooShortTags.join(', ')}"). Use more specific 2-3 word phrases.`,
      passed: false
    });
  }

  keywordScore = Math.max(0, Math.min(100, keywordScore));

  // 4. OVERALL SCORE CALCULATION
  const overall = Math.round(
    titleScore * 0.3 + descScore * 0.25 + keywordScore * 0.45
  );

  let status: QualityAudit['status'] = 'Stock Ready';
  if (overall < 70) {
    status = 'Needs Attention';
  } else if (overall < 86) {
    status = 'Needs Polish';
  }

  return {
    overallScore: overall,
    titleScore,
    descriptionScore: descScore,
    keywordScore,
    keywordCount: count,
    duplicates,
    missingSuggestions,
    metrics,
    status
  };
}
