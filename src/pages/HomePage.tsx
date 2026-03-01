import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { APP_NAME, SOAP_BOX_NAME } from '../lib/brand'

export function HomePage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const features = [
    {
      token: 'DM',
      title: 'Direct Messages For Any Occasion',
      description: 'Send birthday hype, check-ins, surprise notes, and random love to the people you care about.',
    },
    {
      token: 'POST',
      title: 'Create Posts At Your Pace',
      description: 'Draft personal posts, schedule your flow, and choose what stays private or goes public.',
    },
    {
      token: 'SOC',
      title: 'Interactive Soap Box',
      description: 'Drop public takes, collect reactions, and jump into comment threads with the community.',
    },
  ]

  const metrics = [
    { value: 'DM + Feed', label: 'private and public social' },
    { value: 'reactions', label: 'real-time vibes' },
    { value: 'comments', label: 'conversation ready' },
  ]

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <main className="omega-page flex flex-col">
      <header className="omega-shell">
        <nav className="omega-nav fade-up">
          <Link to="/" className="omega-brand">
            <span className="brand-dot" aria-hidden="true" />
            {APP_NAME}
          </Link>
          <div className="nav-links">
            <Link to="/public" className="nav-pill">
              {SOAP_BOX_NAME}
            </Link>
            {user ? (
              <>
                <Link to="/dashboard" className="nav-pill">
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="btn btn-ghost" type="button">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-pill">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Create Account
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <section className="omega-shell mt-4 flex-grow">
        <div className="hero-grid">
          <article className="panel panel-strong p-6 md:p-8 float-in">
            <span className="eyebrow">Social First</span>
            <h1 className="hero-title">Send love, laughs, and life updates all in one place.</h1>
            <p className="hero-subtitle">
              {APP_NAME} helps you message loved ones for any occasion, keep your own post timeline, and jump into the
              {` ${SOAP_BOX_NAME}`} when you want to share with everyone.
            </p>

            <div className="button-row mt-7">
              {user ? (
                <Link to="/dashboard" className="btn btn-primary">
                  Open Dashboard
                </Link>
              ) : (
                <Link to="/register" className="btn btn-primary">
                  Join The Vibe
                </Link>
              )}
              <Link to="/public" className="btn btn-ghost">
                Explore {SOAP_BOX_NAME}
              </Link>
            </div>

            <p className="section-subtitle mt-6">
              Birthdays, anniversaries, pep talks, apologies, inside jokes, and everything in between.
            </p>
          </article>

          <aside className="panel panel-dark p-6 md:p-7 float-in" style={{ animationDelay: '120ms' }}>
            <span className="pill">Live social hub</span>
            <h2 className="mt-3 text-3xl font-semibold leading-tight">Keep close people closer and keep your feed alive.</h2>
            <p className="mt-3 text-sm text-slate-200/90">
              Use private DMs for personal moments and the public feed for stories, hot takes, and community conversations.
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
          <p className="footer-note">
            {APP_NAME} is your social home for private love notes, public stories, and everyday connection.
          </p>
          <div className="button-row mt-3 justify-center">
            {user ? (
              <>
                <Link to="/dashboard" className="btn btn-secondary">
                  Open Dashboard
                </Link>
                <button onClick={handleLogout} className="btn btn-ghost" type="button">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/register" className="btn btn-secondary">
                  Create Your Account
                </Link>
                <Link to="/login" className="btn btn-ghost">
                  Continue Where You Left Off
                </Link>
              </>
            )}
          </div>
        </div>
      </footer>
    </main>
  )
}
