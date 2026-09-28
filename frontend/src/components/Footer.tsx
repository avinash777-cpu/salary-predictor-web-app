const YEAR = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__grid">
        <div className="footer__brand">
          <span className="nav__name">
            Salary<em>Predictor</em>
          </span>
          <p>
            A full-stack ML portfolio project: synthetic data generation, model training,
            REST API and React front end — containerised for one-click deployment.
          </p>
        </div>

        <div className="footer__col">
          <h4>Stack</h4>
          <ul>
            <li>Python · scikit-learn</li>
            <li>Flask · Gunicorn</li>
            <li>React · TypeScript · Vite</li>
            <li>Render (Docker-free deploy)</li>
          </ul>
        </div>

        <div className="footer__col">
          <h4>Pipeline</h4>
          <ul>
            <li>5,000-row synthetic dataset</li>
            <li>4 regressors benchmarked</li>
            <li>Gradient Boosting selected</li>
            <li>Permutation importance</li>
          </ul>
        </div>

        <div className="footer__col">
          <h4>Disclaimer</h4>
          <ul>
            <li>Estimates use synthetic data</li>
            <li>Figures in INR (CTC)</li>
            <li>For demo/educational use</li>
          </ul>
        </div>
      </div>

      <div className="footer__bar">
        <span>© {YEAR} Salary Predictor</span>
        <span className="footer__mono">built for portfolio · not financial advice</span>
      </div>
    </footer>
  )
}
