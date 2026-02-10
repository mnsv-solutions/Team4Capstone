export default function SignInPage() {
  return (
    <main className="panel form-wrap">
      <h1 className="form-title">Sign In</h1>

      <div className="form-area">
        <form>
          <div style={{ marginBottom: "48px" }}>
            <label className="label" htmlFor="loginId">
              Email/Mobile no
            </label>
            <input id="loginId" className="input" type="text" required />
          </div>

          <div style={{ marginBottom: "22px" }}>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input id="password" className="input" type="password" required />
          </div>

          <div className="or-row clearfix" aria-label="Alternative sign in options">
            <div className="or-line" />
            <div className="or-text">OR</div>
            <div className="or-line" />
          </div>

          <button type="button" className="social-btn">
            Continue with Google
          </button>

          <button type="button" className="social-btn">
            Continue with Apple
          </button>
        </form>
      </div>
    </main>
  );
}
