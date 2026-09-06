import citationsData from '@/data/citations.json';
import type { NutrientKey } from '@/utils/normalizeNutrient';

export interface Citation {
  id: string;
  source: string;
  title: string;
  year: number;
  section: string;
  nutrients: string[];
  ageGroups: string[];
  categories?: string[];
  passage: string;
  url: string | null;
}

const citations: Citation[] = citationsData as Citation[];

export function retrieveCitations(nutrientKey: NutrientKey, ageGroup: string, category?: string, maxResults = 2): Citation[] {
  const matches = citations.filter(c => c.nutrients.includes(nutrientKey));

  // Filter by age group
  const specificAge = matches.filter(c => c.ageGroups.includes(ageGroup));
  const generalAge = matches.filter(c => c.ageGroups.includes('all'));
  let ageFiltered = [...specificAge, ...generalAge.filter(g => !specificAge.some(s => s.id === g.id))];

  // Filter by category if provided and citation has categories defined
  if (category) {
    const specificCategory = ageFiltered.filter(c => c.categories && c.categories.includes(category));
    const generalCategory = ageFiltered.filter(c => !c.categories || c.categories.includes('all'));
    ageFiltered = [...specificCategory, ...generalCategory.filter(g => !specificCategory.some(s => s.id === g.id))];
  }

  return ageFiltered.slice(0, maxResults);
}
