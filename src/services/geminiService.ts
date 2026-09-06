import { GoogleGenerativeAI } from '@google/generative-ai';
import { retrieveCitations, type Citation } from './citationRetrieval';
import type { NutrientKey } from '@/utils/normalizeNutrient';

// Initialize the API securely for local dev using the env var we added
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

// Helper to convert a File object to the format our backend/SDK expects
async function fileToGenerativePart(file: File) {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.readAsDataURL(file);
  });
  const base64EncodedData = await base64EncodedDataPromise;

  return {
    inlineData: {
      data: base64EncodedData,
      mimeType: file.type,
    }
  };
}

/**
 * Analyzes a product image (label) to extract nutrition and ingredients directly via Gemini SDK for local dev.
 */
export async function analyzeProductImage(file: File) {
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
     throw new Error("Missing VITE_GEMINI_API_KEY. Please ensure it is set in your .env file.");
  }

  const { inlineData } = await fileToGenerativePart(file);

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-flash-latest",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `
      Analyze this food product label image. 
      Extract the following information and return it as a JSON object matching this schema:
      {
        "name": "Extracted product name or 'Unknown'",
        "brand": "Extracted brand name or 'Unknown'",
        "category": "Guess the best category (e.g. Chocolates, Biscuits, Chips & Snacks, Drinks, Dairy, etc)",
        "serving_size": "Extracted serving size (e.g. '10g')",
        "nutrition": {
          "calories": number,
          "protein": number,
          "carbohydrates": number,
          "totalSugars": number,
          "addedSugars": number,
          "totalFat": number,
          "saturatedFat": number,
          "transFat": number,
          "sodium": number,
          "fiber": number,
          "calcium": number,
          "cholesterol": number,
          "caffeine": number
        },
        "ingredients": [
          "list", "of", "ingredients"
        ],
        "allergens": [
          "list", "of", "allergens"
        ]
      }
      
      If any nutrient value is missing, set it to undefined or null, but try your best to extract it. Normalize weights to numeric values where requested.
    `;

    const result = await model.generateContent([prompt, { inlineData }]);
    const text = result.response.text();
    return JSON.parse(text);
  } catch (error: any) {
    console.error("OCR Analysis failed:", error);
    throw new Error(error.message || 'Internal Server Error');
  }
}

export interface RagExplanation {
  text: string;
  citations: Citation[];      // empty array = no source found, caller must say so
  grounded: boolean;          // false if we had to fall back to ungrounded generation
}

// Simple in-memory cache to prevent redundant API calls for the same explanation
const explanationCache: Record<string, RagExplanation> = {};

/**
 * Uses Gemini API directly in the client to generate the RAG explanation for local testing.
 */
export async function generateRagExplanation(nutrientKey: NutrientKey, ageGroup: string, category: string): Promise<RagExplanation> {
  const cacheKey = `${nutrientKey}-${ageGroup}`;
  if (explanationCache[cacheKey]) {
    return explanationCache[cacheKey];
  }

  const citations = retrieveCitations(nutrientKey, ageGroup, category);

  if (citations.length === 0) {
    // No source found — do NOT fall back to letting the model generate from
    // its own training knowledge. That's exactly the ungrounded-chatbot
    // failure mode the paper positions this system against. Return a plain,
    // honest response instead, and log it so gaps in citations.json surface.
    console.warn(`No citation found for nutrient="${nutrientKey}" ageGroup="${ageGroup}" — citations.json needs an entry for this pair.`);
    const fallback: RagExplanation = {
      text: `${nutrientKey} is a factor in this product's score for this age group. A specific supporting guideline citation isn't available yet for this combination.`,
      citations: [],
      grounded: false,
    };
    explanationCache[cacheKey] = fallback;
    return fallback;
  }

  try {
    const systemInstruction = `
      You are the NutriGuard-AI Explanation Engine.
      You will be given one or more retrieved guideline passages. Your ONLY job is to
      rephrase what is in those passages into a concise (1-2 sentence), plain-language
      explanation for a parent, specific to the given nutrient and age group.
      Do not add any fact, number, or claim that is not present in the passages below.
      If the passages don't fully cover the age group, say what they do cover rather
      than extrapolating.
    `;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-flash-latest",
      systemInstruction: systemInstruction
    });

    const passageText = citations
      .map(c => `[${c.source} ${c.year}, ${c.section}]: "${c.passage}"`)
      .join('\n');

    const prompt = `
      Nutrient: "${nutrientKey}"
      Age group: "${ageGroup}"

      Retrieved passages (use ONLY these, rephrased in plain language):
      ${passageText}

      Write the 1-2 sentence explanation now. Do not quote the passages verbatim;
      paraphrase them for a general audience.
    `;

    const result = await model.generateContent(prompt);
    const explanation: RagExplanation = {
      text: result.response.text().trim(),
      citations,
      grounded: true,
    };
    explanationCache[cacheKey] = explanation;
    return explanation;
  } catch (error) {
    console.error("RAG generation failed:", error);
    return { text: "General health recommendation: Balance macro and micro nutrient intake.", citations: citations, grounded: false };
  }
}
