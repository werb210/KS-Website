import { Link } from "react-router-dom";
import { PRODUCT_NAME } from "../config";
import { usePageMeta } from "../hooks/usePageMeta";
import { NativeScreen } from "../components/Screenshot";
import { ScreenGallery } from "../components/ScreenGallery";

// KS_WEBSITE_OVERHAUL - every picture here is a real screen. The iPad pictures are the staff portal captured at iPad size
// from its demo build (scripts/screenshots). The iPhone dialler and Apple Watch are native apps that can't be captured
// from a web build: their screenshots show only once real ones are added to src/assets/screens/native/ (see its
// README); until then those two are described in words, never drawn.
const DIALLER = [
  "Calls use the iPhone's own call screen, from your business number",
  "The caller's name, file and stage on screen before you answer",
  "Calls, contacts, texts, client messages, team chat and calendar in one app",
  "Mute, keypad, hold, transfer and add someone to the call",
  "One tap to log how the call went; dictate a voice note after it",
  "Voicemail, missed-call alerts and a lock-screen Live Activity",
];

const WATCH = [
  "Dial, favourites and calls due",
  "Recent calls and voicemail",
  "Quick replies and dictation",
  "Take calls without the iPhone nearby",
];

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
        <p className="lede">Your borrowers apply from their phone or any browser. Your staff call, text and work files from their iPhone and iPad.</p>
      </div>

      <section className="section section--tight" aria-labelledby="client-app-h">
        <div className="wrap split">
          <div>
            <h2 id="client-app-h">Client app for iPhone and Android, or any browser</h2>
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

      <section className="section section--surface" aria-labelledby="ipad-h">
        <div className="wrap">
          <h2 id="ipad-h">The staff portal on iPad</h2>
          <p className="section-intro">
            On every plan, the full staff portal runs as an iPad app: pipeline, documents, fraud check and lender
            submissions, with calls, Face ID, business-card scanning and document markup. Select a screen to see it full size.
          </p>
          <ScreenGallery
            layout="duo"
            label="iPad screenshots"
            items={[
              { name: "ipad-pipeline", sizes: "(max-width: 700px) 92vw, 520px", caption: "The pipeline on iPad." },
              { name: "ipad-documents", sizes: "(max-width: 700px) 92vw, 520px", caption: "An application's documents on iPad." },
            ]}
          />
        </div>
      </section>

      <section className="section" aria-labelledby="staff-apps-h">
        <div className="wrap">
          <h2 id="staff-apps-h">For your staff: iPhone dialler and Apple Watch</h2>
          <div className="app-cards">
            <article className="app-card" aria-labelledby="dialler-h">
              <NativeScreen slot="iphone-dialler" alt="The iPhone dialler during a call, with the client's file on screen.">
                {null}
              </NativeScreen>
              <h3 id="dialler-h">iPhone dialler</h3>
              <p className="small muted">Every plan</p>
              <ul className="tick-list">
                {DIALLER.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </article>
            <article className="app-card" aria-labelledby="watch-h">
              <NativeScreen slot="apple-watch" alt="The Apple Watch app showing an incoming call.">
                {null}
              </NativeScreen>
              <h3 id="watch-h">Apple Watch</h3>
              <p className="small muted">Growth and Pro</p>
              <ul className="tick-list">
                {WATCH.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </article>
          </div>
          <p className="small muted" style={{ marginTop: "1.25rem" }}>
            Android apps for staff are coming soon. The client app already works on Android.
          </p>
        </div>
      </section>

      <section className="section section--surface" aria-labelledby="signin-h">
        <div className="wrap wrap--narrow">
          <h2 id="signin-h">Signing in</h2>
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
          <p className="actions">
            <Link className="btn" to="/try">
              Try it yourself
            </Link>
            <Link className="btn btn--quiet" to="/signup">
              Start sign-up
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
