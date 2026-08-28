'use client';

import { useState } from 'react';

export function CopyMcpUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      const el = document.getElementById('never86-mcp-url');
      if (!el) return;
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }

  return (
    <div className="mt-5 rounded-2xl border border-[#b8d2ff] bg-white p-4">
      <p className="compass-card-label">MCP endpoint (paste into every LLM)</p>
      <p id="never86-mcp-url" className="mt-3 break-all font-mono text-[15px] text-[#1d1d1f]">
        {url}
      </p>
      <button
        type="button"
        onClick={copy}
        className="btn-primary mt-4"
        style={{ background: '#0066ff' }}
      >
        {copied ? 'Copied' : 'Copy URL'}
      </button>
    </div>
  );
}
