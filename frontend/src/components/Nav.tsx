export default function Nav() {
  return (
    <header className="nav">
      <a className="nav__brand" href="#top">
        <span className="nav__logo" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
            <path
              d="M12 2.5 20.5 7.25v9.5L12 21.5 3.5 16.75v-9.5L12 2.5Z"
              stroke="url(#lg)"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path d="M8 14.5V10m4 4.5V7.5m4 7v-3" stroke="url(#lg)" strokeWidth="1.6" strokeLinecap="round" />
            <defs>
              <linearGradient id="lg" x1="3" y1="3" x2="21" y2="21">
                <stop stopColor="#22d3ee" />
                <stop offset="0.5" stopColor="#8b5cf6" />
                <stop offset="1" stopColor="#f472b6" />
              </linearGradient>
            </defs>
          </svg>
        </span>
        <span className="nav__name">
          Salary<em>Predictor</em>
        </span>
      </a>

      <nav className="nav__links">
        <a href="#predict">Predict</a>
        <a href="#compare">Compare</a>
        <a href="#model">Model</a>
        <a href="#insights">Insights</a>
      </nav>

      <a
        className="btn btn--ghost nav__cta"
        href="#predict"
        onClick={() => {
          document.getElementById('predict')?.scrollIntoView({ behavior: 'smooth' })
        }}
      >
        Get estimate
      </a>
    </header>
  )
}
