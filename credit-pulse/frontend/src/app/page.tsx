export default function Home() {
  return (
    <main>
      <section className="panel hero">
        <div className="hero-bg" />
        <div className="hero-x" />
        <div className="hero-label">Hero image</div>

        <div className="status-bar">
          <div className="clearfix">
            <input
              className="status-input"
              type="text"
              placeholder="Mobile Number / Application No"
              aria-label="Mobile Number or Application Number"
            />
            <button className="status-btn" type="button">
              Check Status
            </button>
          </div>
        </div>
      </section>

      <section className="cards clearfix" aria-label="Testimonials">
        <div className="card">
          <div className="card-icon" aria-hidden="true" />
          <div style={{ fontSize: "18px", fontWeight: 600 }}>Testimony 1</div>
        </div>

        <div className="card">
          <div className="card-icon" aria-hidden="true" />
          <div style={{ fontSize: "18px", fontWeight: 600 }}>Testimony 2</div>
        </div>

        <div className="card">
          <div className="card-icon" aria-hidden="true" />
          <div style={{ fontSize: "18px", fontWeight: 600 }}>Testimony 3</div>
        </div>

        <div className="card">
          <div className="card-icon" aria-hidden="true" />
          <div style={{ fontSize: "18px", fontWeight: 600 }}>Testimony 4</div>
        </div>
      </section>
    </main>
  );
}
