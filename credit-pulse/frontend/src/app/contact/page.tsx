export default function ContactPage() {
  return (
    <main className="d-flex flex-column gap-4">
      {/* Top section: page title and introduction */}
      <section className="cp-hero-section">
        <h1 className="fw-bold mb-3">Contact Us</h1>

        <p className="mb-2">
          Have a question about your loan application or need assistance?
          Our team is here to help.
        </p>

        <p className="mb-0">
          Fill out the form below and we will respond as soon as possible.
        </p>
      </section>

      {/* Middle section: form + contact info side by side */}
      <section className="cp-hero-section">
        <div className="row g-4">

          {/* LEFT SIDE → Contact Form */}
          <div className="col-12 col-lg-6">
            <div className="cp-card h-100">
              <h2 className="h5 fw-bold mb-3">Send a Message</h2>

              <form>
                {/* Name field */}
                <div className="mb-3">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter your full name"
                  />
                </div>

                {/* Email field */}
                <div className="mb-3">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="Enter your email address"
                  />
                </div>

                {/* Subject field */}
                <div className="mb-3">
                  <label className="form-label">Subject</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter subject"
                  />
                </div>

                {/* Message field */}
                <div className="mb-3">
                  <label className="form-label">Message</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    placeholder="Write your message here..."
                  ></textarea>
                </div>

                {/* Submit button */}
                <button type="submit" className="btn btn-primary">
                  Submit
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT SIDE → Contact details */}
          <div className="col-12 col-lg-6">
            <div className="cp-card h-100">
              <h2 className="h5 fw-bold mb-3">Get in Touch</h2>

              <p className="mb-2">
                Our support team is available during regular business hours.
              </p>

              <p className="mb-2">
                Email: support@creditpulse.com
              </p>

              <p className="mb-2">
                Phone: +1 (000) 123-4567
              </p>

              <p className="mb-0">
                We aim to respond within 24–48 hours.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Bottom section: Frequently Asked Questions */}
      <section className="cp-hero-section">
        <h2 className="fw-bold mb-3">Frequently Asked Questions</h2>

        <div className="row g-3">

          {/* FAQ 1 */}
          <div className="col-12 col-md-6">
            <div className="cp-card h-100">
              <h3 className="h6 fw-bold mb-2">
                How can I check my loan status?
              </h3>
              <p className="mb-0">
                You can use the status check feature on the homepage by entering
                your mobile number or application number.
              </p>
            </div>
          </div>

          {/* FAQ 2 */}
          <div className="col-12 col-md-6">
            <div className="cp-card h-100">
              <h3 className="h6 fw-bold mb-2">
                How long does approval take?
              </h3>
              <p className="mb-0">
                Processing times vary depending on verification and documentation.
                You will receive updates as your application progresses.
              </p>
            </div>
          </div>

          {/* FAQ 3 */}
          <div className="col-12 col-md-6">
            <div className="cp-card h-100">
              <h3 className="h6 fw-bold mb-2">
                What documents are required?
              </h3>
              <p className="mb-0">
                Required documents may include ID proof, income verification,
                and address details depending on the loan type.
              </p>
            </div>
          </div>

          {/* FAQ 4 */}
          <div className="col-12 col-md-6">
            <div className="cp-card h-100">
              <h3 className="h6 fw-bold mb-2">
                Who do I contact for help?
              </h3>
              <p className="mb-0">
                You can contact our support team using the form above or through
                the provided email and phone number.
              </p>
            </div>
          </div>

        </div>
      </section>

    </main>
  );
}