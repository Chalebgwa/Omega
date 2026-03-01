import Link from 'next/link'

export default function Home() {
  const features = [
    {
      token: 'MSG',
      title: 'Private Message Vaults',
      description: 'Write direct notes for the people you care about and keep them in one calm, secure timeline.',
    },
    {
      token: 'LOG',
      title: 'Timed Journal Rhythm',
      description: 'Add thoughtful entries at your own cadence so your archive grows naturally over time.',
    },
    {
      token: 'PUB',
      title: 'Public Soap Box',
      description: 'Share selected reflections openly while keeping your most personal words private.',
    },
  ]

  const metrics = [
    { value: '2 modes', label: 'private + public' },
    { value: '1 feed', label: 'all your entries' },
    { value: 'forever', label: 'captured in one place' },
  ]

  return (
    <main className="omega-page flex flex-col">
      <header className="omega-shell">
        <nav className="omega-nav fade-up">
          <Link href="/" className="omega-brand">
            <span className="brand-dot" aria-hidden="true" />
            Omega
          </Link>
          <div className="nav-links">
            <Link href="/public" className="nav-pill">
              Soap Box
            </Link>
            <Link href="/login" className="nav-pill">
              Login
            </Link>
            <Link href="/register" className="btn btn-primary">
              Create Account
            </Link>
          </div>
        </nav>
      </header>

      <section className="omega-shell mt-4 flex-grow">
        <div className="hero-grid">
          <article className="panel panel-strong p-6 md:p-8 float-in">
            <span className="eyebrow">Legacy Archive</span>
            <h1 className="hero-title">Give your words a final polished home.</h1>
            <p className="hero-subtitle">
              Omega helps you craft messages, journals, and public reflections with enough warmth to feel personal and enough
              structure to stay clear for years.
            </p>

            <div className="button-row mt-7">
              <Link href="/register" className="btn btn-primary">
                Start Building
              </Link>
              <Link href="/public" className="btn btn-ghost">
                Explore Soap Box
              </Link>
            </div>

            <p className="section-subtitle mt-6">
              Built for letters, video memories, and recurring notes you never want to lose.
            </p>
          </article>

          <aside className="panel panel-dark p-6 md:p-7 float-in" style={{ animationDelay: '120ms' }}>
            <span className="pill">At a glance</span>
            <h2 className="mt-3 text-3xl font-semibold leading-tight">One place for private keepsakes and public voice.</h2>
            <p className="mt-3 text-sm text-slate-200/90">
              Keep your intentions clear with entries that are easy to revisit, schedule, and share when it matters most.
            </p>

            <div className="metric-grid mt-7">
              {metrics.map((metric) => (
                <div key={metric.label} className="metric">
                  <strong>{metric.value}</strong>
                  <span>{metric.label}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>

        <div className="feature-grid mt-4">
          {features.map((feature, index) => (
            <article
              key={feature.title}
              className="feature-card float-in"
              style={{ animationDelay: `${190 + index * 90}ms` }}
            >
              <span className="feature-token">{feature.token}</span>
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="section-subtitle mt-2">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="omega-shell mt-5">
        <div className="panel px-5 py-4 text-center">
          <p className="footer-note">Omega is a personal archive for the people and moments that should never fade.</p>
          <div className="button-row mt-3 justify-center">
            <Link href="/register" className="btn btn-secondary">
              Begin Your Archive
            </Link>
            <Link href="/login" className="btn btn-ghost">
              Continue Writing
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
