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
            Calibrated salary estimates for the Indian job market — with transparent metrics,
            live market benchmarks and every prediction clearly explained.
          </p>
        </div>

        <div className="footer__col">
          <h4>Dataset</h4>
          <ul>
            <li>5,000 salary profiles</li>
            <li>18 job roles · 10 cities</li>
            <li>6 predictive signals</li>
            <li>Figures in INR (CTC)</li>
          </ul>
        </div>

        <div className="footer__col">
          <h4>What you get</h4>
          <ul>
            <li>Salary range with confidence band</li>
            <li>Market percentile per profile</li>
            <li>Role &amp; experience benchmarks</li>
            <li>Published model accuracy</li>
          </ul>
        </div>

        <div className="footer__col">
          <h4>Disclaimer</h4>
          <ul>
            <li>Trained on synthetic data</li>
            <li>Indicative estimates only</li>
            <li>Not financial advice</li>
          </ul>
        </div>
      </div>

      <div className="footer__bar">
        <span>© {YEAR} Salary Predictor</span>
        <span className="footer__mono">estimates are indicative · built for demonstration</span>
      </div>
    </footer>
  )
}
