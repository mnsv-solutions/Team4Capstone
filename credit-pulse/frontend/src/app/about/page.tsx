import Image from "next/image";

export default function AboutPage() {
  return (
    <main className="d-flex flex-column gap-4">
      <section className="cp-hero-section">
        <h1 className="fw-bold mb-3">About CreditPulse</h1>

        <p className="mb-2">
          CreditPulse is a Digital Loan Origination & Credit Assessment Platform created as our
          final-year Capstone project. Our goal is to make the loan journey easier for users by
          providing clear steps, transparent status updates, and a simple dashboard experience.
        </p>

        <p className="mb-0">
          This project focuses on helping users understand where their loan application stands,
          what actions are required next, and what information is needed to move forward.
        </p>
      </section>

      <section className="cp-hero-section">
        <h2 className="fw-bold mb-3">What the platform helps users do</h2>

        <div className="row g-3">
          <div className="col-12 col-md-6">
            <div className="cp-card h-100">
              <h3 className="h5 fw-bold mb-2">Loan Application Tracking</h3>
              <p className="mb-0">
                Users can check the progress of their application and understand the current stage
                in a clear way.
              </p>
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="cp-card h-100">
              <h3 className="h5 fw-bold mb-2">Clear Next Steps</h3>
              <p className="mb-0">
                The platform highlights what the user needs to do next, so there is less confusion
                and fewer delays.
              </p>
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="cp-card h-100">
              <h3 className="h5 fw-bold mb-2">Document Readiness</h3>
              <p className="mb-0">
                Users can understand which documents are typically needed and prepare them early to
                avoid rework.
              </p>
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="cp-card h-100">
              <h3 className="h5 fw-bold mb-2">Improved User Experience</h3>
              <p className="mb-0">
                We aim for a simple, modern UI that is easy to use for everyone, on desktop and
                mobile.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="cp-hero-section">
        <h2 className="fw-bold mb-3">Basic Loan Information</h2>

        <div className="row g-3">
          <div className="col-12 col-lg-6">
            <div className="cp-card h-100">
              <h3 className="h5 fw-bold mb-2">What is loan origination?</h3>
              <p className="mb-0">
                Loan origination is the process of applying for a loan, submitting details, and
                getting the request reviewed by the lender.
              </p>
            </div>
          </div>

          <div className="col-12 col-lg-6">
            <div className="cp-card h-100">
              <h3 className="h5 fw-bold mb-2">What is credit assessment?</h3>
              <p className="mb-0">
                Credit assessment is the evaluation of a user’s ability to repay, usually based on
                factors like income, existing debt, credit history, and verification checks.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="cp-hero-section">
        <h2 className="fw-bold mb-3">Meet the Team</h2>
        <p className="mb-4">
          This Capstone project is developed by students from Conestoga College:
        </p>

        <div className="row g-3">
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="cp-card text-center h-100">
              <div className="mb-3">
                <Image
                  src="/team/victor.jpg"
                  alt="Victor Ferreira Araujo"
                  width={140}
                  height={140}
                  style={{ borderRadius: "50%" }}
                />
              </div>
              <h3 className="h6 fw-bold mb-1">Victor Ferreira Araujo</h3>
              <p className="mb-0">Team Member</p>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="cp-card text-center h-100">
              <div className="mb-3">
                <Image
                  src="/team/sukhpreet.jpg"
                  alt="Sukhpreet Singh"
                  width={140}
                  height={140}
                  style={{ borderRadius: "50%" }}
                />
              </div>
              <h3 className="h6 fw-bold mb-1">Sukhpreet Singh</h3>
              <p className="mb-0">Team Member</p>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="cp-card text-center h-100">
              <div className="mb-3">
                <Image
                  src="/team/nirali.jpg"
                  alt="Nirali Dineshkumar Patel"
                  width={140}
                  height={140}
                  style={{ borderRadius: "50%" }}
                />
              </div>
              <h3 className="h6 fw-bold mb-1">Nirali Dineshkumar Patel</h3>
              <p className="mb-0">Team Member</p>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="cp-card text-center h-100">
              <div className="mb-3">
                <Image
                  src="/team/miswa.jpg"
                  alt="Miswa Shaileshbhai Patel"
                  width={140}
                  height={140}
                  style={{ borderRadius: "50%" }}
                />
              </div>
              <h3 className="h6 fw-bold mb-1">Miswa Shaileshbhai Patel</h3>
              <p className="mb-0">Team Member</p>
            </div>
          </div>
        </div>

      
      </section>

      <section className="cp-hero-section">
        <h2 className="fw-bold mb-3">Project Details</h2>

        <div className="row g-3">
          <div className="col-12 col-lg-6">
            <div className="cp-card h-100">
              <h3 className="h5 fw-bold mb-2">Project Type</h3>
              <p className="mb-0">
                Final Year Capstone Project (Conestoga College)
              </p>
            </div>
          </div>

          <div className="col-12 col-lg-6">
            <div className="cp-card h-100">
              <h3 className="h5 fw-bold mb-2">Goal</h3>
              <p className="mb-0">
                Build a modern loan platform UI that is simple, clear, and user-friendly.
              </p>
            </div>
          </div>

          <div className="col-12">
            <div className="cp-card">
              <h3 className="h5 fw-bold mb-2">Website Purpose</h3>
              <p className="mb-0">
                This website demonstrates our planned UI and user flow for loan application tracking,
                guidance, and credit assessment visibility. Backend features will be integrated as
                the project progresses.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}