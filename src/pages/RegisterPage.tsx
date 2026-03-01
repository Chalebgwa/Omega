import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { APP_NAME, SOAP_BOX_NAME } from '../lib/brand'

export function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await register(formData.name, formData.email, formData.password)
      navigate('/dashboard')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="omega-page">
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
            <Link to="/login" className="btn btn-ghost">
              Sign in
            </Link>
          </div>
        </nav>
      </header>

      <main className="omega-shell mt-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr]">
          <section className="form-wrap float-in order-2 lg:order-1">
            <div className="section-head mb-6">
              <div>
                <h2 className="section-title">Create account</h2>
                <p className="section-subtitle">
                  Already have one?{' '}
                  <Link to="/login" className="underline decoration-2 decoration-amber-500 underline-offset-4">
                    Sign in
                  </Link>
                  .
                </p>
              </div>
            </div>

            <form className="form-grid" onSubmit={handleSubmit}>
              {error && <div className="notice-error">{error}</div>}

              <div className="field">
                <label htmlFor="name">Full name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="input"
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="field">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="input"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="field">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="input"
                    placeholder="Create password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>

                <div className="field">
                  <label htmlFor="confirmPassword">Confirm password</label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    className="input"
                    placeholder="Repeat password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
                </div>
              </div>

              <div className="button-row mt-2">
                <button type="submit" disabled={loading} className="btn btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-70">
                  {loading ? 'Creating account...' : 'Create account'}
                </button>
                <Link to="/" className="btn btn-ghost">
                  Back Home
                </Link>
              </div>
            </form>
          </section>

          <section className="panel panel-dark p-6 md:p-8 float-in order-1 lg:order-2" style={{ animationDelay: '120ms' }}>
            <span className="pill">Join the community</span>
            <h1 className="mt-3 text-4xl leading-tight">Set up your social space in under a minute.</h1>
            <p className="mt-3 text-sm text-slate-200/90">
              Once signed up, you can DM loved ones, schedule your own posts, and jump into {SOAP_BOX_NAME} convos.
            </p>

            <div className="stack mt-8">
              <div className="metric">
                <strong>DM by person</strong>
                <span>Send direct messages for any occasion.</span>
              </div>
              <div className="metric">
                <strong>Post on your rhythm</strong>
                <span>Keep a personal stream with optional public sharing.</span>
              </div>
              <div className="metric">
                <strong>React + Comment</strong>
                <span>Join conversations and keep the feed moving.</span>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
