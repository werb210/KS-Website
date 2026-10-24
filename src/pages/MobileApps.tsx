import { Link } from "react-router-dom";
import { PRODUCT_NAME } from "../config";
import { usePageMeta } from "../hooks/usePageMeta";

function Phone({ title, rows }: { title: string; rows: string[] }) {
  return (
    <div className="device" aria-hidden="true">
      <div className="device__screen">
        <div className="device__title">{title}</div>
        {rows.map((r, i) => (
          <div key={i}>
            <div className={`device__bar${i === 0 ? " device__bar--accent" : ""}`} style={{ width: `${90 - i * 12}%` }} />
            <div>{r}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MobileApps() {
  usePageMeta(
    "Mobile apps",
    `${PRODUCT_NAME} mobile apps: a branded client app for iPhone and Android (or the same client portal as a website in any browser), an iPhone dialler with Apple Watch app for staff, and the staff portal on iPad.`,
    "/mobile-apps",
  );
  return (
    <>
      <div className="wrap page-head">
        <h1>Apps for your clients and your team</h1>
        <p>Your borrowers apply from their phone or any browser. Your staff call, text and check files from their phones.</p>
      </div>
      <section className="section section--tight">
        <div className="wrap split">
          <div>
            <h2>Client app for iPhone and Android, or any browser</h2>
            <p>
              Your clients choose how they use it: as your brokerage's own app on iPhone or Android, or as a website
              in any browser on a computer, tablet or phone. Both have the same 6-step application and client
              mini-portal, with your name, colours and wording.
            </p>
            <p>
              The app is listed in the App Store and Google Play under your name and is already connected to your
              system, so borrowers just download it, sign in with a one-time code sent to their phone, upload
              documents with the camera and get notified when you need something. The website needs nothing
              installed.
            </p>
            <h2 style={{ marginTop: "2rem" }}>iPhone dialler for staff</h2>
            <p>
              Call and text from your business number. Incoming calls show who's calling and their deal before you
              answer. Every call and text lands on the file automatically.
            </p>
            <h2 style={{ marginTop: "2rem" }}>Apple Watch and iPad</h2>
            <p>
              On Growth and Pro, take and place calls from Apple Watch, and run the full staff portal on iPad.
            </p>
          </div>
          <div className="devices">
            <Phone title="Application" rows={["Step 3 of 6", "Funding needed", "Use of funds", "Upload statements"]} />
            <Phone title="Dialler" rows={["Incoming call", "Pipeline: Docs requested", "Last note: 2 days ago"]} />
            <div className="device device--watch" aria-hidden="true">
              <div className="device__screen">
                <div className="device__title">Call</div>
                <div className="device__bar device__bar--accent" />
                <div>Answer</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="section section--surface">
        <div className="wrap wrap--narrow">
          <h2>Your company code is for your staff</h2>
          <p>
            When you sign up you choose a company code, a short name like <code>prairie-capital</code>. The first time
            one of your staff opens the iPhone dialler or the iPad app they enter that code once, and the app connects
            to your brokerage's own system and shows your branding from then on.
          </p>
          <p>
            Your clients never enter a company code. They use your brokerage's own app on iPhone or Android, published
            from your Apple and Google developer accounts, or your client portal as a website in any browser, at its own
            address. It's their choice, and both are already connected to your system.
          </p>
          <p>
            <Link className="btn" to="/signup">
              Start sign-up
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
