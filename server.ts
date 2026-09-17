import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// High payload limit for image data transfers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lazy GoogleGenAI initialization
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// 1. Health & Config Status API
app.get('/api/status', (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY';
  res.json({
    status: 'ok',
    hasGeminiKey: hasKey,
    mode: hasKey ? 'live' : 'demo',
    timestamp: Date.now()
  });
});

// Helper: Smart Demo/Fallback Metadata Generator
function generateFallbackMetadata(filename: string, marketplace: string = 'adobe-stock') {
  const cleanName = filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  const capitalized = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

  return {
    title: `${capitalized} in High Quality Composition`,
    description: `Professional stock photo showcasing ${cleanName.toLowerCase()} with clean natural lighting and thoughtful framing suitable for commercial editorial media projects.`,
    keywords: [
      cleanName.toLowerCase(),
      'stock photo',
      'composition',
      'professional',
      'background',
      'concept',
      'creative',
      'design',
      'detail',
      'nobody',
      'clean',
      'modern',
      'natural light',
      'copy space',
      'texture',
      'visual',
      'commercial',
      'high quality',
      'lifestyle',
      'contemporary',
      'horizontal',
      'outdoor',
      'still life',
      'digital photography',
      'vibrant',
      'isolated subject',
      'closeup',
      'sharp focus',
      'authenticity',
      'artistic'
    ],
    primaryKeywords: [cleanName.toLowerCase(), 'stock photo', 'composition', 'clean', 'modern'],
    secondaryKeywords: ['texture', 'visual', 'commercial', 'contemporary', 'artistic', 'sharp focus'],
    category: 'Lifestyle',
    contentType: 'Photo',
    commercialEditorial: 'Commercial',
    commercialReason: 'No visible logos, trademarks, or identifiable private property observed.',
    isDemoFallback: true
  };
}

// 2. AI Metadata Generation API
app.post('/api/generate-metadata', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', filename = 'image.jpg', marketplace = 'adobe-stock' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'No image data provided.' });
    }

    // Clean base64 string
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');

    const ai = getGeminiClient();

    // If no key is set or empty, provide realistic demo metadata
    if (!ai) {
      const demo = generateFallbackMetadata(filename, marketplace);
      return res.json({
        ...demo,
        demoNote: 'Generated in Demo Mode (GEMINI_API_KEY not configured). Real AI analysis activates when an API key is connected.'
      });
    }

    const systemPrompt = `You are an elite Stock Photography and Vector Asset Contributor Metadata Specialist.
You generate exact, commercially optimized metadata for platforms including Adobe Stock, Shutterstock, iStock/Getty, Freepik, and Vecteezy.

CRITICAL COMPLIANCE RULES:
1. Describe ONLY visible and reasonably inferable content from the image.
2. NEVER invent people, specific locations, celebrities, brands, logos, events, dates, or fictional scenarios that are not clearly visible.
3. TITLE RULES:
   - Concise, natural, informative (30-80 characters).
   - Capitalize the first letter. Avoid ALL CAPS.
   - Describe the main subject, setting, and perspective.
   - NO promotional buzzwords (NO "stunning", "amazing", "best", "gorgeous", "download").
   - NO quotation marks or keyword stuffing.
4. DESCRIPTION RULES:
   - 15-40 words describing subject, context, lighting, color mood, and composition.
   - Strictly factual and objective.
5. KEYWORDS RULES:
   - Generate exactly 30 to 45 highly relevant, unique keywords.
   - Order strictly from MOST IMPORTANT first to secondary conceptual terms.
   - Put the first 5-10 primary direct visual nouns/verbs first (crucial for Adobe Stock ranking).
   - Next include setting, color, perspective, mood, and commercial concepts.
   - ZERO duplicates.
   - Avoid brand names unless clearly visible and legitimate.
   - Avoid misleading or spam tags.
6. CATEGORY:
   - Provide the single best category matching standard stock taxonomy (e.g. Business, Lifestyle, Nature, Technology, Animals, Architecture, Food, Travel, etc.).
7. CONTENT TYPE:
   - "Photo", "Illustration", "Vector", "3D Render", or "AI-Generated".
8. COMMERCIAL VS EDITORIAL:
   - If recognizable faces without evident property/model releases, visible brand logos, or protected landmarks exist, mark as "Editorial".
   - If clean generic subjects, landscapes, food, nature, or unbranded objects, mark as "Commercial".
   - Provide a 1-sentence "commercialReason".

Selected target marketplace: "${marketplace}". Ensure guidelines are adhered to.`;

    const userPrompt = `Analyze this stock submission image (original filename: "${filename}").
Return a JSON object conforming strictly to the required schema with accurate title, description, 30-45 keywords in order of relevance, primary keywords, secondary keywords, category, contentType, commercialEditorial, and commercialReason.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType
            }
          },
          { text: userPrompt }
        ]
      },
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: 'Clear, concise stock-friendly title (30-80 characters, no promotional hype).'
            },
            description: {
              type: Type.STRING,
              description: 'Professional factual description of visible elements (15-40 words).'
            },
            keywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Array of 30 to 45 unique keywords ordered from most important to conceptual.'
            },
            primaryKeywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'The top 5 to 10 most critical direct visual keywords.'
            },
            secondaryKeywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Contextual, mood, background, and conceptual keywords.'
            },
            category: {
              type: Type.STRING,
              description: 'Standard stock agency category name.'
            },
            contentType: {
              type: Type.STRING,
              description: 'One of Photo, Illustration, Vector, 3D Render, AI-Generated'
            },
            commercialEditorial: {
              type: Type.STRING,
              description: 'Either Commercial or Editorial'
            },
            commercialReason: {
              type: Type.STRING,
              description: 'Brief reason why Commercial or Editorial was suggested.'
            }
          },
          required: [
            'title',
            'description',
            'keywords',
            'primaryKeywords',
            'secondaryKeywords',
            'category',
            'contentType',
            'commercialEditorial'
          ]
        }
      }
    });

    const rawText = response.text || '';
    let parsedData;
    try {
      parsedData = JSON.parse(rawText);
    } catch {
      // Fallback regex extraction if raw markdown wrapping occurred
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse model JSON response');
      }
    }

    // Ensure keywords is a deduplicated array
    const dedupedKeywords: string[] = [];
    const seen = new Set<string>();
    for (const kw of parsedData.keywords || []) {
      const clean = String(kw).trim().toLowerCase();
      if (clean && !seen.has(clean)) {
        seen.add(clean);
        dedupedKeywords.push(clean);
      }
    }

    return res.json({
      title: parsedData.title || filename.replace(/\.[^/.]+$/, ''),
      description: parsedData.description || '',
      keywords: dedupedKeywords,
      primaryKeywords: (parsedData.primaryKeywords || []).map((k: string) => String(k).trim().toLowerCase()),
      secondaryKeywords: (parsedData.secondaryKeywords || []).map((k: string) => String(k).trim().toLowerCase()),
      category: parsedData.category || 'Lifestyle',
      contentType: parsedData.contentType || 'Photo',
      commercialEditorial: parsedData.commercialEditorial === 'Editorial' ? 'Editorial' : 'Commercial',
      commercialReason: parsedData.commercialReason || 'Visible content audited for commercial release suitability.'
    });
  } catch (error: any) {
    console.error('Gemini metadata generation failed:', error);

    // If Gemini fails due to rate limits or API key invalidation, provide demo fallback with clear message
    const { filename = 'image.jpg', marketplace = 'adobe-stock' } = req.body || {};
    const fallback = generateFallbackMetadata(filename, marketplace);

    return res.json({
      ...fallback,
      warning: `AI API notice: ${error.message || 'Request failed'}. Showing smart fallback metadata.`
    });
  }
});

// 3. Keyword Suggestion & Expansion API
app.post('/api/suggest-keywords', async (req, res) => {
  try {
    const { title = '', description = '', currentKeywords = [] } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // Return smart keyword expansion based on title terms
      const words = `${title} ${description}`
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 3);

      const suggestions = Array.from(new Set([...words, 'concept', 'modern', 'digital', 'copy space', 'background', 'design', 'commercial']))
        .filter((w) => !currentKeywords.includes(w))
        .slice(0, 15);

      return res.json({ suggestions });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Given the stock photo title "${title}" and description "${description}", suggest 15 high-converting, relevant stock keywords that are NOT in this existing list: [${currentKeywords.join(', ')}]. Return only a JSON array of strings.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const suggestions = JSON.parse(response.text || '[]');
    res.json({ suggestions });
  } catch (err: any) {
    res.json({ suggestions: ['high quality', 'composition', 'modern', 'authentic', 'background'] });
  }
});

// Mount Vite or static serving
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

setupVite();
