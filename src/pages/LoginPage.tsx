import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { APP_NAME, SOAP_BOX_NAME } from '../lib/brand'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(formData.email, formData.password)
      navigate('/dashboard')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed'
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
            <Link to="/register" className="btn btn-primary">
              Create Account
            </Link>
          </div>
        </nav>
      </header>

      <main className="omega-shell mt-5">
        <div className="grid gap-4 lg:grid-cols-[1.05fr_1fr]">
          <section className="panel panel-dark p-6 md:p-8 float-in">
            <span className="pill">Welcome back</span>
            <h1 className="mt-3 text-4xl leading-tight">Jump back into your social circle.</h1>
            <p className="mt-3 text-sm text-slate-200/90">
              Open your DMs, post new updates, and join ongoing conversations on {SOAP_BOX_NAME}.
            </p>

            <div className="metric-grid mt-8">
              <div className="metric">
                <strong>Private</strong>
                <span>direct messages</span>
              </div>
              <div className="metric">
                <strong>Personal</strong>
                <span>post timeline</span>
              </div>
              <div className="metric">
                <strong>Public</strong>
                <span>reactions + comments</span>
              </div>
            </div>
          </section>

          <section className="form-wrap float-in" style={{ animationDelay: '120ms' }}>
            <div className="section-head mb-6">
              <div>
                <h2 className="section-title">Sign in</h2>
                <p className="section-subtitle">
                  New here?{' '}
                  <Link to="/register" className="underline decoration-2 decoration-amber-500 underline-offset-4">
                    Create an account
                  </Link>
                  .
                </p>
              </div>
            </div>

            <form className="form-grid" onSubmit={handleSubmit}>
              {error && <div className="notice-error">{error}</div>}

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

              <div className="field">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="input"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div className="button-row mt-2">
                <button type="submit" disabled={loading} className="btn btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-70">
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
                <Link to="/" className="btn btn-ghost">
                  Back Home
                </Link>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  )
}
