import Link from 'next/link';

/** Unsigned /operator first paint. Asks for sign-in. Does not restyle the desk. */
export function OperatorSignIn() {
  return (
    <main className="compass min-h-screen">
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
        <Link href="/" className="flex items-start gap-4 group">
          <span className="compass-mark">N</span>
          <span>
            <p className="font-serif text-[24px] leading-none text-ink-800">
              Never 86&apos;d <span className="italic text-ink-600">· owner desk</span>
            </p>
            <p className="compass-eyebrow-dim mt-2">Sign in to open your seat</p>
          </span>
        </Link>
      </div>

      <section className="max-w-md mx-auto px-6 pt-20 md:pt-28">
        <p className="compass-eyebrow mb-4">— Returning owner</p>
        <h1 className="compass-display text-4xl md:text-5xl mb-3">Sign in to your operator.</h1>
        <p className="compass-body text-[15px] mb-8" style={{ color: '#86868b' }}>
          This desk is for a verified owner with a seat. Use the email link, or the password you set once.
        </p>
        <div className="compass-card space-y-3">
          <Link href="/login" className="btn-primary w-full text-center" style={{ background: '#0066ff' }}>
            Sign in →
          </Link>
          <p className="text-center text-[13px] leading-relaxed text-[#86868b]">
            New here?{' '}
            <Link href="/onboard" className="underline" style={{ color: '#0066ff' }}>
              Claim the free owner seat
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
