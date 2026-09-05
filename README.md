# NutriGuard 🛡️

NutriGuard is an advanced, transparent nutritional scoring engine and analysis tool designed to evaluate Indian retail packaged foods. Moving beyond simple traffic-light systems, NutriGuard dynamically calculates a 0–100 score (Grades A to E) based on a rigorous 4-pillar algorithmic framework that adapts to different age groups. It empowers users to make healthier dietary choices by scanning product labels, understanding complex nutritional data through AI-driven explanations, and exploring counterfactual scenarios.

## 🌟 Core Features

- **AI-Powered OCR Label Scanning:** Upload a photo of a food label, and our integrated Gemini 1.5 Flash Vision model instantly extracts all nutritional information, ingredients, and product details.
- **AI RAG Explanation Engine:** Leverages Gemini 1.5 Flash to generate real-time, plain-language explanations for specific nutritional concerns (e.g., high sodium) based strictly on embedded WHO and ICMR-NIN dietary guidelines.
- **Dynamic Scoring Engine:** Calculates nutritional scores on-the-fly without relying on hardcoded values.
- **Age-Banded Evaluation:** Generates unique nutritional grades based on reference intakes for Child, Teen, Adult, and Elderly profiles (using ICMR-NIN 2020 thresholds).
- **NOVA Classification Penalty:** Strictly integrates the NOVA framework to mathematically penalize ultra-processed foods (NOVA 4).
- **Transparent Equation Builder:** Breaks down exactly how a product scored across its 4 pillars (Nutrition, Ingredients, Processing, Additives).
- **Counterfactual Scenarios:** Allows dynamic recalculation of scores to see what happens when specific metrics (like sugar or sodium) are tweaked.
- **Responsive Premium UI:** Built with React and Tailwind CSS for a fluid, app-like experience.

## 🧮 How It Works (The Engine)

### The V1 Scoring Framework
The score is calculated via the Master Formula:
`NGS_raw = (0.20 * I) + (0.15 * P) + (0.30 * A)`
`Final Score = NOVA_Scale_Multiplier * NGS_raw + (0.35 * N_capped)`

1. **N (Nutrition):** Evaluates negative nutrients (Sugar, Sodium, Saturated Fats) against positive nutrients (Protein, Fiber).
2. **I (Ingredients):** Rewards whole foods while penalizing refined flours and added sugars.
3. **P (Processing):** Penalizes category-specific processing methods.
4. **A (Additives):** Scans for E-numbers and maps them against health-risk thresholds.

### AI Integrations
- **Label Scanning:** The app uses `@google/generative-ai` to pass uploaded images to Gemini. Gemini performs multimodal OCR to extract structured JSON data about the product's macros, ingredients, and serving size.
- **Medical Explainability:** When evaluating a product, the app identifies the "Dominant Nutrient" (the worst offender). It then uses a Retrieval-Augmented Generation (RAG) approach, passing the specific nutrient and age group along with our local `citations.json` database to Gemini. Gemini strictly cites these authoritative medical guidelines to explain *why* the nutrient is harmful.

## 🚀 Tech Stack

- **Frontend:** React 18, Vite
- **Routing:** React Router DOM (v7)
- **State Management:** Zustand
- **AI Integration:** Google Gemini API (via Client-side `@google/generative-ai` SDK)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (v4), Lucide React
- **PWA Support:** vite-plugin-pwa (Offline Mode)
- **Database:** Supabase Postgres (Migrated from Local JSON)

## 📡 Offline vs. Online Capabilities (PWA)

NutriGuard is built as a Progressive Web App (PWA).
- **Available Offline:** Browsing the product catalogue, filtering, and viewing the detailed equation breakdown for existing products in the database are fully available offline. The scoring engine runs completely on the client.
- **Requires Internet:** 
  - **OCR Label Scanning:** Uploading an image to parse a new product requires contacting the Gemini API.
  - **AI Explainability:** Generating evidence-based explanations directly queries the Gemini API, requiring an active internet connection.

## 📁 Detailed Project Structure

```text
nutriguard/
├── public/                     # High-quality graphical assets, icons, and fonts
├── scripts/                    # Scripts for algorithm evaluation and dataset generation
│   ├── evaluation/             # Test suites for scoring engine validation
│   └── results/                # Output analysis, CSVs, and generated charts
├── src/                        # Main source code directory
│   ├── components/             # Shared, generic UI components
│   │   ├── layout/             # Structural application components
│   │   │   ├── Footer.tsx      # Global footer component
│   │   │   └── Navbar.tsx      # Global navigation bar component
│   │   └── index.ts            # Component exports barrel file
│   │
│   ├── data/                   # Static JSON databases acting as local APIs & fallbacks
│   │   ├── additives.json      # Health-risk mappings for E-numbers and additives
│   │   ├── citations.json      # Reference sources and literature (WHO, ICMR-NIN)
│   │   ├── ingredients.json    # Nutritional details of specific ingredients
│   │   ├── products.json       # 100+ mapped retail products with detailed info
│   │   └── knowledge_base/     # Authoritative medical guidelines (PDFs)
│   │       ├── FSSAI/          # FSSAI Additives and Prohibition Regulations
│   │       │   ├── Food_Additives_Regulations.pdf
│   │       │   └── Prohibition_Regulations.pdf
│   │       ├── ICMR/           # ICMR-NIN 2020 Dietary Guidelines for Indians
│   │       │   └── ICMR.pdf
│   │       └── WHO/            # WHO guidelines on Fat, Sodium, Sugar, and Carbs
│   │           ├── WHO carbohydrate.pdf
│   │           ├── WHO Fat.pdf
│   │           ├── WHO sodium.pdf
│   │           └── WHO sugar.pdf
│   │
│   ├── features/               # Feature-based modular architecture (Domain Logic)
│   │   ├── home/               # Landing page feature
│   │   │   ├── components/     # Home-specific components
│   │   │   │   ├── FeatureCard.tsx
│   │   │   │   ├── Hero.tsx
│   │   │   │   ├── StatsBar.tsx
│   │   │   │   └── index.ts
│   │   │   └── Landing.tsx     # Main Landing Page view
│   │   ├── products/           # Product catalog feature
│   │   │   ├── components/     # Catalog-specific components
│   │   │   │   ├── ProductCard.tsx
│   │   │   │   ├── SearchBar.tsx
│   │   │   │   └── index.ts
│   │   │   └── Products.tsx    # Main Product Catalog view
│   │   └── scan/               # Barcode/Label scanner & AI explainability feature
│   │       ├── components/     # Scan-specific interactive cards
│   │       │   ├── AgeScoreCard.tsx       # Dynamic scoring per age group
│   │       │   ├── AllergenBanner.tsx     # Highlights detected allergens
│   │       │   ├── CompareTable.tsx       # Side-by-side alternative comparison
│   │       │   ├── ComparisonCard.tsx     # Suggests healthier alternatives
│   │       │   ├── ExplainabilityCard.tsx # Gemini AI RAG explanation UI
│   │       │   ├── IngredientChip.tsx     # Color-coded ingredient pill
│   │       │   ├── RecommendationCard.tsx # Dietitian-style verdict
│   │       │   ├── ScoreBreakdown.tsx     # 4-pillar equation visualization
│   │       │   ├── UploadBox.tsx          # Drag-and-drop OCR upload zone
│   │       │   └── index.ts
│   │       └── Scan.tsx        # Main Scanner & Analysis view
│   │
│   ├── pages/                  # Static React Router views
│   │   ├── About.tsx           # About the mission and team
│   │   ├── FAQs.tsx            # Frequently Asked Questions
│   │   ├── HowItWorks.tsx      # Deep dive into the scoring framework
│   │   └── index.ts            
│   │
│   ├── services/               # External API integrations
│   │   ├── geminiService.ts    # Direct Gemini 1.5 Flash SDK integration for OCR & RAG
│   │   └── supabaseClient.ts   # Supabase DB connection and queries
│   │
│   ├── store/                  # Global state management
│   │   └── useAppStore.ts      # Zustand store for app-wide state
│   │
│   ├── types/                  # TypeScript interfaces
│   │   └── index.ts            # Type definitions for products, scores, and APIs
│   │
│   ├── utils/                  # Core algorithmic engine and helper functions
│   │   ├── counterfactual.ts   # Logic for dynamic "What-If" score tweaking
│   │   ├── index.ts            # Utils barrel file
│   │   ├── normalizeNutrient.ts # Unified nutrient extraction and aliasing logic
│   │   ├── scoreCalculator.test.ts # Unit tests for the scoring engine
│   │   └── scoreCalculator.ts  # The primary master formula calculation logic
│   │
│   ├── App.tsx                 # Root React component containing the Router
│   ├── index.css               # Global stylesheet and Tailwind CSS directives
│   └── main.tsx                # Vite entry point
│
├── package.json                # Defines dependencies, scripts, and metadata
└── vite.config.ts              # Vite bundler configuration
```

## 📦 Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/nutriguard.git
   cd nutriguard
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Create a `.env` file in the root directory and add your Gemini API key:
   ```env
   VITE_GEMINI_API_KEY="your_api_key_here"
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

## 📝 License
MIT License
