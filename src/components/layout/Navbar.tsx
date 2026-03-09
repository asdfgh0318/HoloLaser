import { Link, useLocation } from 'react-router-dom';

const links = [
  { to: '/', label: 'Home' },
  { to: '/simulator', label: 'Simulator' },
  { to: '/about', label: 'About / Math' },
];

export function Navbar() {
  const location = useLocation();

  return (
    <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm" role="navigation" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-bold tracking-tight text-cyan-400">
            HoloLaser
          </Link>
          <div className="flex gap-1">
            {links.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === to
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`}
                aria-current={location.pathname === to ? 'page' : undefined}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
