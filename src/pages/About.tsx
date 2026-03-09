export function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">About &amp; Mathematics</h1>
      <div className="prose prose-invert max-w-none space-y-6">
        <p className="text-gray-400">
          This page will contain the full mathematical derivation of the inverse Radon
          transform approach used to compute laser projection masks, rendered with KaTeX.
        </p>
        <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50 text-gray-500 text-sm">
          LaTeX math content coming soon...
        </div>
      </div>
    </div>
  );
}
