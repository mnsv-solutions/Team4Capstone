// This page introduces the CreditPulse product story, team, and project purpose.
import Image from "next/image";
import styles from "./page.module.css";

// These cards explain the main user-facing benefits of the platform.
const platformHighlights = [
  {
    title: "Transparent application journey",
    description:
      "Applicants can understand where they are in the process, what has been completed, and what comes next without guesswork.",
  },
  {
    title: "Action-focused guidance",
    description:
      "CreditPulse reduces delays by showing the next required step, the right documents, and the checks still in progress.",
  },
  {
    title: "Built for trust and clarity",
    description:
      "The experience is designed to feel approachable for applicants while still reflecting the structure of a credit workflow.",
  },
];

// These steps describe the high-level application journey shown on the page.
const journeySteps = [
  {
    number: "01",
    title: "Submit and verify",
    description:
      "Applicants begin with core details and identity verification so the platform can establish a reliable application record.",
    image: "/about/about-hero.svg",
    alt: "Illustration of a digital loan application dashboard",
  },
  {
    number: "02",
    title: "Track progress clearly",
    description:
      "Status updates, checkpoints, and review stages are surfaced in a simple way so users always know what is happening.",
    image: "/about/about-workflow.svg",
    alt: "Illustration of a loan workflow with progress cards",
  },
  {
    number: "03",
    title: "Move forward with confidence",
    description:
      "The platform helps applicants prepare documents, respond faster, and stay informed through decision milestones.",
    image: "/about/about-security.svg",
    alt: "Illustration showing secure review and document readiness",
  },
];

// These team entries power the profile cards for the capstone team.
const teamMembers = [
  {
    name: "Victor Ferreira Araujo",
    responsibilities: "Back-end Developer, DevOps",
    image: "/about/team-image/team-member-3.jpeg",
    imagePosition: "center 24%",
  },
  {
    name: "Sukhpreet Singh",
    responsibilities: "Product Owner, Scrum Master, Back-end Developer, Database Designer",
    image: "/about/team-image/team-member-2.jpeg",
  },
  {
    name: "Nirali Dineshkumar Patel",
    responsibilities: "Front-end Developer, Tester",
    image: "/about/team-image/team-member-4.jpeg",
  },
  {
    name: "Miswa Shaileshbhai Patel",
    responsibilities: "Front-end Developer, Tester",
    image: "/about/team-image/team-member-1.jpeg",
  },
];

// These cards explain the lending concepts behind the project in simple language.
const knowledgeCards = [
  {
    title: "Loan origination",
    description:
      "The origination process covers application intake, identity capture, document collection, review, and decisioning.",
  },
  {
    title: "Credit assessment",
    description:
      "Credit assessment looks at repayment ability through information such as income, liabilities, history, and verification outcomes.",
  },
  {
    title: "Why visibility matters",
    description:
      "Applicants feel more confident when they can see their stage, understand requirements, and respond to issues quickly.",
  },
];

export default function AboutPage() {
  return (
    <main className={styles.page}>
      {/* Hero section: product purpose and first impression */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>About CreditPulse</h1>
          <p className={styles.heroLead}>
            CreditPulse is a digital loan origination and credit assessment platform created for
            our final-year Capstone project. We built it around one core idea: applicants should
            never feel lost during an important financial process.
          </p>
          <p className={styles.heroBody}>
            Instead of vague updates and confusing handoffs, the platform focuses on clear stages,
            visible progress, and practical next steps so users can move through the loan journey
            with more confidence.
          </p>

          <div className={styles.metrics}>
            <div className={styles.metricCard}>
              <strong>Clear stages</strong>
              <span>Application milestones explained in plain language</span>
            </div>
            <div className={styles.metricCard}>
              <strong>Faster follow-up</strong>
              <span>Document and action visibility helps reduce delays</span>
            </div>
            <div className={styles.metricCard}>
              <strong>User-first design</strong>
              <span>Built for desktop and mobile applicants alike</span>
            </div>
          </div>
        </div>

        <div className={styles.heroVisual}>
          <div className={styles.heroImageShell}>
            <Image
              src="/about/about-hero.svg"
              alt="CreditPulse dashboard and loan journey illustration"
              width={700}
              height={520}
              className={styles.heroImage}
              priority
            />
          </div>
          <div className={styles.heroVisualAccent} aria-hidden="true" />
        </div>

      </section>

      {/* Team section: member photos and responsibilities */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>Meet the team</span>
          <h2 className={styles.sectionTitle}>Built by Conestoga College capstone students</h2>
          <p className={styles.sectionText}>
            This project was developed collaboratively with a focus on usability, transparency, and
            a modern applicant experience.
          </p>
        </div>

        <div className={styles.teamGrid}>
          {teamMembers.map((member) => (
            <article key={member.name} className={styles.teamCard}>
              <div className={styles.avatar}>
                <Image
                  src={member.image}
                  alt={`${member.name} profile photo`}
                  width={220}
                  height={220}
                  className={styles.avatarImage}
                  style={
                    member.imagePosition
                      ? { objectPosition: member.imagePosition }
                      : undefined
                  }
                />
              </div>
              <h3>{member.name}</h3>
              <p>{member.responsibilities}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Value section: why the platform matters for applicants */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>Why it matters</span>
          <h2 className={styles.sectionTitle}>The platform is built around applicant clarity.</h2>
          <p className={styles.sectionText}>
            CreditPulse is not just about submitting a loan request. It is about helping users
            understand status, prepare what is needed, and stay confident while their application
            is reviewed.
          </p>
        </div>

        <div className={styles.highlightGrid}>
          {platformHighlights.map((item) => (
            <article key={item.title} className={styles.highlightCard}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Journey section: product flow explained in three visual steps */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>Platform journey</span>
          <h2 className={styles.sectionTitle}>How CreditPulse supports the loan experience</h2>
        </div>

        <div className={styles.journeyGrid}>
          {journeySteps.map((step) => (
            <article key={step.number} className={styles.journeyCard}>
              <div className={styles.journeyImageWrap}>
                <Image
                  src={step.image}
                  alt={step.alt}
                  width={420}
                  height={260}
                  className={styles.journeyImage}
                />
              </div>
              <div className={styles.journeyBody}>
                <span className={styles.stepNumber}>{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Concepts section: plain-language explanations of key lending ideas */}
      <section className={styles.infoSection}>
        <div className={styles.infoPanel}>
          <div className={styles.infoIntro}>
            <span className={styles.sectionEyebrow}>Core concepts</span>
            <h2 className={styles.sectionTitle}>The project combines process design and credit visibility.</h2>
            <p className={styles.sectionText}>
              We wanted the About page to explain the product in simple language, especially for
              users who may not be familiar with lending terms.
            </p>
          </div>

          <div className={styles.knowledgeGrid}>
            {knowledgeCards.map((card) => (
              <article key={card.title} className={styles.knowledgeCard}>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Footer summary: final project framing and goals */}
      <section className={styles.footerPanel}>
        <div>
          <span className={styles.sectionEyebrow}>Project details</span>
          <h2 className={styles.sectionTitle}>A modern academic prototype with real product intent</h2>
          <p className={styles.sectionText}>
            CreditPulse demonstrates a complete front-end experience for loan application tracking,
            next-step guidance, and credit assessment visibility. The goal is to show how a clearer
            interface can make a complex process feel more approachable.
          </p>
        </div>

        <div className={styles.footerStats}>
          <div className={styles.footerStatCard}>
            <span>Project type</span>
            <strong>Final Year Capstone</strong>
          </div>
          <div className={styles.footerStatCard}>
            <span>Focus</span>
            <strong>Clarity, trust, and guidance</strong>
          </div>
          <div className={styles.footerStatCard}>
            <span>Experience goal</span>
            <strong>Simple, informative, and user-friendly</strong>
          </div>
        </div>
      </section>
    </main>
  );
}
