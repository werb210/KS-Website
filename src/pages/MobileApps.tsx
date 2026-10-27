import { Link } from "react-router-dom";
import { PRODUCT_NAME } from "../config";
import { usePageMeta } from "../hooks/usePageMeta";
import { NativeScreen } from "../components/Screenshot";
import { ScreenGallery } from "../components/ScreenGallery";

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
          </div>
          <ScreenGallery
            layout="phones"
            label="Client app screenshots"
            items={[
              { name: "client-wizard", sizes: "(max-width: 600px) 30vw, 220px", caption: "The application, step 3 of 6." },
              { name: "client-portal", sizes: "(max-width: 600px) 30vw, 220px", caption: "The client's own portal." },
              { name: "client-calculator", sizes: "(max-width: 600px) 30vw, 220px", caption: "A loan calculator on the More tab." },
            ]}
          />
        </div>
      </section>
      <section className="section section--tight" aria-labelledby="staff-apps-h">
        <div className="wrap split">
          <div>
            <h2 id="staff-apps-h">For your staff: iPhone, Apple Watch and iPad</h2>
            <h3>iPhone dialler</h3>
            <p>
              Call and text from your business number. Incoming calls show who's calling and their deal before you
              answer. Every call and text lands on the file automatically.
            </p>
            <h3>iPad</h3>
            <p>
              On every plan, run the full staff portal on iPad: pipeline, documents, fraud check and lender
              submissions.
            </p>
            <h3>Apple Watch</h3>
            <p>On Growth and Pro, take and place calls from Apple Watch.</p>
          </div>
          <div className="devices">
            <NativeScreen slot="iphone-dialler" alt="The iPhone dialler during a call, with the client's file on screen.">
              <Phone title="Dialler" rows={["Incoming call", "Pipeline: Docs requested", "Last note: 2 days ago"]} />
            </NativeScreen>
            <NativeScreen slot="apple-watch" alt="The Apple Watch app showing an incoming call.">
              <div className="device device--watch" aria-hidden="true">
                <div className="device__screen">
                  <div className="device__title">Call</div>
                  <div className="device__bar device__bar--accent" />
                  <div>Answer</div>
                </div>
              </div>
            </NativeScreen>
          </div>
        </div>
        <div className="wrap" style={{ marginTop: "2.5rem" }}>
          <ScreenGallery
            layout="single"
            label="iPad screenshot"
            items={[{ name: "ipad-documents", sizes: "(max-width: 600px) 92vw, 480px", caption: "The staff portal on iPad." }]}
          />
        </div>
      </section>
      <section className="section section--surface">
        <div className="wrap wrap--narrow">
          <h2>Signing in</h2>
          <p>
            Your staff sign in to the dialler and iPad apps with their work email or mobile number; the app finds your
            brokerage automatically and shows your branding from then on.
          </p>
          <p>
            Your clients use your brokerage's own app on iPhone or Android, published from your Apple and Google
            developer accounts, or your client portal as a website in any browser, at its own address. It's their
            choice, and both are already connected to your system. They sign in with a one-time code sent to their
            phone.
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
