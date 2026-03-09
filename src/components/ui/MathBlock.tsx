import katex from 'katex';
import 'katex/dist/katex.min.css';

export function MathBlock({ tex, display = true }: { tex: string; display?: boolean }) {
  const html = katex.renderToString(tex, { displayMode: display, throwOnError: false });
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

export function InlineMath({ tex }: { tex: string }) {
  return <MathBlock tex={tex} display={false} />;
}
