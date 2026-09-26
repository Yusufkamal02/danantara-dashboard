import { Shell } from "@/components/Shell";
import { Panel, KpiTile, BarRow, AlertRow, Treemap } from "@/components/Panel";
import { Term } from "@/components/Term";
import { PricePanel } from "@/components/charts/PricePanel";
import { YoYArea, Donut } from "@/components/charts/MiniCharts";
import { YOY_GROWTH, HIMBARA_SHARE, REVENUE_SEGMENTS } from "@/data/market";
import { SECTOR_ALLOCATION, HOLDINGS, PORTFOLIO_TOTALS } from "@/data/holdings";
import { NEWS, CALENDAR, RISK_ALERTS } from "@/data/feed";

const TOP_HOLDINGS = HOLDINGS.slice(0, 10);

export default function IkhtisarPage() {
  const maxSector = SECTOR_ALLOCATION[0].pct;

  return (
    <Shell
      subtitle="Portfolio Analytics Terminal"
      command="BBRI IJ EQUITY"
      meta={`IKHTISAR PORTOFOLIO · ${PORTFOLIO_TOTALS.issuers} EMITEN · NAV Rp ${PORTFOLIO_TOTALS.nav.toLocaleString("id-ID")} T`}
    >
      <main
        className="main-grid"
        style={{ "--col-left": "250px", "--col-right": "274px" } as React.CSSProperties}
      >
        {/* ---------------- left ---------------- */}
        <div className="col col-left">
          <Panel title="Filter Global" chip="REGION · SEKTOR" className="panel-chart" style={{ height: 150 }} bodyStyle={{ padding: 8 }}>
            <Treemap
              rows={[
                [
                  { name: "Himbara", pct: 44, color: "var(--accent-amber)", flex: 6 },
                  { name: "Energi", pct: 21, color: "var(--accent-orange)", flex: 4 },
                ],
                [
                  { name: "Telko", pct: 13, color: "var(--accent-blue)", flex: 1 },
                  { name: "Tambang", pct: 12, color: "var(--accent-violet)", flex: 1 },
                  { name: "Infra", pct: 10, color: "var(--status-positive)", flex: 1 },
                ],
              ]}
            />
          </Panel>

          <Panel title="Alokasi Sektor" chip={<Term k="NAV" label="% NAV" />} style={{ height: 250 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {SECTOR_ALLOCATION.map((s) => (
                <BarRow
                  key={s.name}
                  label={s.name}
                  value={`${s.pct.toFixed(1).replace(".", ",")}%`}
                  fraction={s.pct / maxSector}
                  color={s.color}
                />
              ))}
            </div>
          </Panel>

          <Panel
            title="Top Holdings"
            chip={`${PORTFOLIO_TOTALS.issuers} EMITEN`}
            className="panel-grow"
            bodyStyle={{ padding: 8, overflow: "auto" }}
          >
            <table className="tbl">
              <thead>
                <tr>
                  <th className="left">KODE</th>
                  <th className="left">EMITEN</th>
                  <th>
                    <Term k="CHG" label="CHG" />
                  </th>
                  <th>NILAI T</th>
                </tr>
              </thead>
              <tbody>
                {TOP_HOLDINGS.map((h) => (
                  <tr key={h.ticker}>
                    <td className="left" style={{ color: "var(--accent-amber)", fontWeight: 700, fontSize: "calc(11px * var(--fs-scale))" }}>
                      {h.ticker}
                    </td>
                    <td className="left truncate" style={{ fontFamily: "var(--font-sans)", fontSize: "calc(11px * var(--fs-scale))", width: "100%" }}>
                      {h.name}
                    </td>
                    <td className={h.changePct >= 0 ? "pos" : "neg"} style={{ fontWeight: 600 }}>
                      {h.changePct >= 0 ? "+" : ""}
                      {h.changePct.toFixed(2).replace(".", ",")}%
                    </td>
                    <td>{h.value.toLocaleString("id-ID", { minimumFractionDigits: 1 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>

        {/* ---------------- centre ---------------- */}
        <div className="col col-main">
          <div className="tile-row">
            <KpiTile
              label={<Term k="Market Cap" label="MARKET CAP" />}
              value={`Rp ${PORTFOLIO_TOTALS.marketCap.toLocaleString("id-ID")} T`}
              delta="+2,4% MoM"
              foot="agregat 42 emiten"
              up
            />
            <KpiTile
              label={<Term k="YTD" label="RETURN YTD" />}
              value={`+${PORTFOLIO_TOTALS.returnYtd.toString().replace(".", ",")}%`}
              delta="+6,1 pp vs IHSG"
              foot={<Term k="TWR" label="TWR, net dividen" />}
              up
            />
            <KpiTile
              label={<Term k="Dividend Yield" label="DIVIDEND YIELD" />}
              value={`${PORTFOLIO_TOTALS.dividendYield.toString().replace(".", ",")}%`}
              delta="+0,3 pp YoY"
              foot="dividen 12 bulan / harga"
              up
            />
            <KpiTile
              label={<Term k="Weighted ROE" label="ROE TERTIMBANG" />}
              value={`${PORTFOLIO_TOTALS.weightedRoe.toString().replace(".", ",")}%`}
              delta="-0,7 pp QoQ"
              foot="42 emiten portofolio"
              up={false}
            />
          </div>

          <div className="chart-slot">
            <PricePanel />
          </div>

          <div className="split-row">
            <Panel
              title="Berita & Sentimen Langsung"
              chip="AUTO-REFRESH 30s"
              style={{ flexGrow: 1, minWidth: 0 }}
              bodyStyle={{ padding: 8, overflow: "auto" }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                {NEWS.map((n) => (
                  <div
                    key={n.time}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "42px 54px minmax(0, 1fr)",
                      gap: 8,
                      alignItems: "baseline",
                      padding: "4px 0",
                      borderBottom: "1px solid var(--border-row)",
                    }}
                  >
                    <span className="mono dim" style={{ fontSize: "calc(10px * var(--fs-scale))" }}>
                      {n.time}
                    </span>
                    <span
                      className={`mono ${n.tone === "up" ? "pos" : n.tone === "down" ? "neg" : "dim"}`}
                      style={{ fontSize: "calc(10px * var(--fs-scale))", fontWeight: 700 }}
                    >
                      {n.ticker}
                    </span>
                    <span className="truncate" style={{ fontSize: "calc(11.5px * var(--fs-scale))", width: "100%" }}>
                      {n.headline}
                    </span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Kalender Korporasi" chip="OKT 2026" style={{ width: 300, flexShrink: 0 }} bodyStyle={{ padding: 8, overflow: "auto" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {CALENDAR.map((c) => (
                  <div
                    key={c.date + c.ticker}
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "baseline",
                      padding: "4px 0",
                      borderBottom: "1px solid var(--border-row)",
                    }}
                  >
                    <span className="mono" style={{ width: 44, flexShrink: 0, fontSize: "calc(10px * var(--fs-scale))", fontWeight: 600, color: "var(--accent-amber)" }}>
                      {c.date}
                    </span>
                    <span className="mono dim" style={{ width: 42, flexShrink: 0, fontSize: "calc(10px * var(--fs-scale))", fontWeight: 700 }}>
                      {c.ticker}
                    </span>
                    <span className="truncate" style={{ fontSize: "calc(11px * var(--fs-scale))", width: "100%" }}>
                      {c.event.includes("RUPS") ? <Term k="RUPS" label={c.event} /> : c.event.includes("Cum date") ? <Term k="Cum Date" label={c.event} /> : c.event}
                    </span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>

        {/* ---------------- right ---------------- */}
        <div className="col col-right">
          <Panel title="Pendapatan per Segmen" chip="BBRI · 9M-26" className="panel-chart" style={{ height: 170 }} bodyStyle={{ padding: 8 }}>
            <Treemap
              labelSize={9}
              rows={[
                [
                  { name: "Mikro", pct: REVENUE_SEGMENTS[0].pct, color: REVENUE_SEGMENTS[0].color, flex: 58 },
                  { name: "Korporasi", pct: REVENUE_SEGMENTS[1].pct, color: REVENUE_SEGMENTS[1].color, flex: 42 },
                ],
                [
                  { name: "Konsumer", pct: REVENUE_SEGMENTS[2].pct, color: REVENUE_SEGMENTS[2].color, flex: 1 },
                  { name: "Treasury", pct: REVENUE_SEGMENTS[3].pct, color: REVENUE_SEGMENTS[3].color, flex: 1 },
                  { name: "Fee", pct: REVENUE_SEGMENTS[4].pct, color: REVENUE_SEGMENTS[4].color, flex: 1 },
                ],
              ]}
            />
          </Panel>

          <Panel title={<><Term k="Himbara" label="Pangsa Kredit Himbara" /></>} chip="Q3-2026" style={{ height: 210 }}>
            <Donut slices={HIMBARA_SHARE} centre="Rp 7,1 rb T" caption="total kredit" />
          </Panel>

          <Panel title="Pertumbuhan Pendapatan YoY" chip={<Term k="YoY" label="AGREGAT" />} className="panel-chart" style={{ height: 150 }} bodyStyle={{ padding: 8 }}>
            <YoYArea data={YOY_GROWTH} />
          </Panel>

          <Panel
            title="Peringatan Risiko"
            chip={`${RISK_ALERTS.length} AKTIF`}
            className="panel-grow"
            bodyStyle={{ padding: 8, overflow: "auto" }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {RISK_ALERTS.map((a) => (
                <AlertRow key={a.body} level={a.level} label={a.label}>
                  {a.body.includes("DER") ? (
                    <>
                      PGAS — rasio <Term k="DER" /> 1,42x mendekati batas 1,50x
                    </>
                  ) : a.body.includes("NPL") ? (
                    <>
                      BBTN — <Term k="NPL Gross" label="NPL gross" /> naik ke 3,4% (+0,4 <Term k="pp" /> QoQ)
                    </>
                  ) : a.body.includes("kovenan") ? (
                    <>
                      SMGR — margin EBITDA turun 3,1 <Term k="pp" /> QoQ, di bawah <Term k="Covenant" label="kovenan" /> internal
                    </>
                  ) : (
                    a.body
                  )}
                </AlertRow>
              ))}
            </div>
          </Panel>
        </div>
      </main>
    </Shell>
  );
}
