import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Navbar, Footer } from '@/components';

// Helper to retry lazy imports if they fail (e.g. after a new deployment when chunks change)
function lazyWithRetry(componentImport: () => Promise<any>) {
  return lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
    );

    try {
      const component = await componentImport();
      window.sessionStorage.setItem('page-has-been-force-refreshed', 'false');
      return component;
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');
        window.location.reload();
      }
      throw error;
    }
  });
}

// Lazy load pages for performance
const Landing = lazyWithRetry(() => import('@/features/home/Landing').then(module => ({ default: module.Landing })));
const Products = lazyWithRetry(() => import('@/features/products/Products').then(module => ({ default: module.Products })));
const Scan = lazyWithRetry(() => import('@/features/scan/Scan').then(module => ({ default: module.Scan })));
const About = lazyWithRetry(() => import('@/pages').then(module => ({ default: module.About })));
const HowItWorks = lazyWithRetry(() => import('@/pages').then(module => ({ default: module.HowItWorks })));
const FAQs = lazyWithRetry(() => import('@/pages').then(module => ({ default: module.FAQs })));

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col font-sans">
        <Navbar />

        <main className="flex-1 flex flex-col">
          <Suspense fallback={<div className="flex-1 flex items-center justify-center min-h-[50vh]"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/products" element={<Products />} />
              <Route path="/scan" element={<Scan />} />
              <Route path="/product/:id" element={<Scan />} />
              <Route path="/about" element={<About />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/faqs" element={<FAQs />} />
            </Routes>
          </Suspense>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
