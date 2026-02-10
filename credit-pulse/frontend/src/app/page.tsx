export default function Home() {
  return (
    <main>
      <section className="panel hero" aria-label="Hero">
        <div className="hero-bg" aria-hidden="true" />
        <div className="hero-x" aria-hidden="true" />
        <div className="hero-label">Hero image</div>

        <div className="status-bar">
          <form className="clearfix" action="#" method="post">
            <input
              className="status-input"
              type="text"
              name="statusQuery"
              placeholder="Mobile Number / Application No"
              aria-label="Mobile Number or Application Number"
              autoComplete="tel"
              inputMode="numeric"
            />
            <button className="status-btn" type="submit">
              Check Status
            </button>
          </form>
        </div>
      </section>

      <section className="cards clearfix" aria-label="Testimonials">
        <ul className="cards-list" aria-label="Testimonials list">
          <li className="card">
            <div className="card-icon" aria-hidden="true" />
            <div className="card-title">Testimony 1</div>
          </li>

          <li className="card">
            <div className="card-icon" aria-hidden="true" />
            <div className="card-title">Testimony 2</div>
          </li>

          <li className="card">
            <div className="card-icon" aria-hidden="true" />
            <div className="card-title">Testimony 3</div>
          </li>

          <li className="card">
            <div className="card-icon" aria-hidden="true" />
            <div className="card-title">Testimony 4</div>
          </li>
        </ul>
      </section>
    </main>
  );
}
