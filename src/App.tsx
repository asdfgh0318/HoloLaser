import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SkipLink } from './components/layout/SkipLink';
import { Navbar } from './components/layout/Navbar';
import { HomePage } from './pages/Home';
import { SimulatorPage } from './pages/Simulator';
import { AboutPage } from './pages/About';

export function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
        <SkipLink />
        <Navbar />
        <main id="main-content" tabIndex={-1} className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/simulator" element={<SimulatorPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
