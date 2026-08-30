import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Privacy · Never 86'd",
  description:
    "How Never 86'd handles data on the public read-only MCP and the website. No restaurant login on the public pack.",
  alternates: { canonical: 'https://www.never86.ai/privacy' },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <main className="compass min-h-screen">
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
        <Link href="/" className="flex items-start gap-4 group">
          <span className="compass-mark">N</span>
          <span>
            <p className="font-serif text-[24px] leading-none text-ink-800">
              Never 86{"'"}d <span className="italic text-ink-600">· privacy</span>
            </p>
            <p className="compass-eyebrow-dim mt-2">Public MCP · website</p>
          </span>
        </Link>
      </div>

      <article className="max-w-3xl mx-auto px-6 pt-16 pb-24">
        <p className="compass-eyebrow mb-6">— Privacy</p>
        <h1 className="compass-display text-5xl md:text-6xl mb-8">
          What we take. <em>What we do not.</em>
        </h1>
        <p className="compass-body text-lg mb-10">
          Last updated August 28, 2026. Company: Never 86{"'"}d Inc., Fort Dodge, Iowa.
          Contact <a className="font-semibold text-[#0066ff] hover:underline" href="mailto:press@never86.ai">press@never86.ai</a>
          {' '}or{' '}
          <a className="font-semibold text-[#0066ff] hover:underline" href="mailto:myke@n86.app">myke@n86.app</a>.
        </p>

        <div className="space-y-8 compass-body text-base">
          <section>
            <h2 className="font-serif text-2xl text-[#1d1d1f] mb-3">Public MCP plugin</h2>
            <p>
              The public connector at https://www.never86.ai/api/mcp is unauthenticated and read-only.
              You type numbers and questions in ChatGPT, Claude, Gemini, or Grok. Those companies process the chat under their own privacy policies. When the model calls our tools, we receive the tool arguments (for example a search query or a typed close: sales, labor, voids) so we can return formulas and copyable drafts.
            </p>
          </section>
          <section>
            <h2 className="font-serif text-2xl text-[#1d1d1f] mb-3">We do not</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Ask for a restaurant POS password on this public pack.</li>
              <li>Collect payment cards through the plugin.</li>
              <li>Send vendor email, issue refunds, post on social, or move money.</li>
              <li>Sell operator data.</li>
            </ul>
          </section>
          <section>
            <h2 className="font-serif text-2xl text-[#1d1d1f] mb-3">Website</h2>
            <p>
              never86.ai may use standard logs and analytics to keep the site up. Paid or tenant products, if you sign up later, get a separate notice at signup. This page covers the public website and the public MCP.
            </p>
          </section>
          <section>
            <h2 className="font-serif text-2xl text-[#1d1d1f] mb-3">Retention</h2>
            <p>
              Tool-call logs are used to operate and debug the public MCP. We do not use public-pack arguments to train a public model. Ask press@never86.ai to review or delete a record we hold.
            </p>
          </section>
        </div>

        <p className="compass-body mt-12 text-sm">
          <Link href="/terms" className="font-semibold text-[#0066ff] hover:underline">Terms</Link>
          {' · '}
          <Link href="/llm-shells" className="font-semibold text-[#0066ff] hover:underline">Try in four LLMs</Link>
        </p>
      </article>
    </main>
  );
}
