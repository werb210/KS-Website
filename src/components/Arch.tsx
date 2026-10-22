import { PRODUCT_NAME } from "../config";

const STONES = ["Pipeline", "Contacts", "Dialler", "Calendar", null, "Documents", "Client portal", "Lenders", "Assistant"];

const CX = 210;
const CY = 250;
const R_IN = 112;
const R_OUT = 196;
const SEG = 180 / STONES.length;
const GAP = 1.4;

function polar(r: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY - r * Math.sin(a)];
}

function wedge(a0: number, a1: number, rIn: number, rOut: number): string {
  const [x0, y0] = polar(rOut, a0);
  const [x1, y1] = polar(rOut, a1);
  const [x2, y2] = polar(rIn, a1);
  const [x3, y3] = polar(rIn, a0);
  const f = (n: number) => n.toFixed(2);
  return `M${f(x0)} ${f(y0)} A${rOut} ${rOut} 0 0 0 ${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)} A${rIn} ${rIn} 0 0 1 ${f(x3)} ${f(y3)} Z`;
}

/**
 * The hero illustration: an arch whose stones are the parts of the system. The keystone (top, gold) is the
 * product itself, placed last, the piece that holds the rest together.
 */
export function Arch() {
  const order = [0, 8, 1, 7, 2, 6, 3, 5, 4];
  return (
    <svg
      className="arch"
      viewBox="0 0 420 290"
      role="img"
      aria-label={`An arch built from the parts of ${PRODUCT_NAME}: pipeline, contacts, dialler, calendar, documents, client portal, lenders and assistant, held together by the keystone.`}
    >
      {STONES.map((label, i) => {
        // Stones run from the left foot (180°) to the right foot (0°).
        const a0 = 180 - i * SEG - GAP / 2;
        const a1 = 180 - (i + 1) * SEG + GAP / 2;
        const isKey = label === null;
        const mid = (a0 + a1) / 2;
        const [lx, ly] = polar((R_IN + R_OUT) / 2, mid);
        const rot = mid > 90 ? 180 - mid : -mid;
        const delay = order.indexOf(i) * 90;
        return (
          <g key={i} className="arch__piece" style={{ animationDelay: `${delay}ms` }}>
            <path
              className={isKey ? "arch__key" : "arch__stone"}
              d={isKey ? wedge(a0 + 1.5, a1 - 1.5, R_IN - 6, R_OUT + 14) : wedge(a0, a1, R_IN, R_OUT)}
            />
            {label && (
              <text
                className="arch__label"
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="central"
                transform={`rotate(${rot} ${lx} ${ly})`}
              >
                {label}
              </text>
            )}
          </g>
        );
      })}
      <line className="arch__ground" x1="0" x2="420" y1={CY + 1} y2={CY + 1} />
      <text x={CX} y={CY - 40} textAnchor="middle" className="arch__label" style={{ fontSize: 15, fontFamily: "var(--font-display)" }}>
        {PRODUCT_NAME}
      </text>
      <text x={CX} y={CY - 20} textAnchor="middle" className="arch__label" style={{ fontWeight: 400, fill: "#556373" }}>
        holds it all together
      </text>
    </svg>
  );
}
