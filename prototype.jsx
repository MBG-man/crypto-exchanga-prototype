import { useState, useEffect, useMemo, useRef } from "react";
import {
  ArrowUpRight, ArrowDownRight, Check, ChevronRight, ChevronLeft,
  Landmark, CreditCard, Smartphone, Copy, ArrowLeftRight
} from "lucide-react";

const COINS = [
  { sym: "BTC", name: "Bitcoin", rate: 165_400_000, chains: ["Bitcoin"] },
  { sym: "ETH", name: "Ethereum", rate: 6_180_000, chains: ["Ethereum", "Base"] },
  { sym: "BNB", name: "BNB", rate: 982_000, chains: ["BNB Smart Chain"] },
  { sym: "SOL", name: "Solana", rate: 212_500, chains: ["Solana"] },
  { sym: "ADA", name: "Cardano", rate: 948, chains: ["Cardano"] },
  { sym: "USDT", name: "Tether", rate: 1_652, chains: ["Tron", "Ethereum", "BNB Smart Chain", "Solana"] },
];

const GAS = { BTC: 0.0003, ETH: 0.0009, BNB: 0.0006, SOL: 0.00004, ADA: 0.17, USDT: 0.6 };

const STEPS = ["Currency", "Amount", "Payout", "Destination", "Confirm"];

const naira = (n) =>
  "₦" + Math.round(n).toLocaleString("en-NG");

const crypto = (n, sym) =>
  n.toLocaleString("en-NG", { maximumFractionDigits: sym === "ADA" || sym === "USDT" ? 2 : 6 });

function useLiveRates() {
  const [rates, setRates] = useState(() =>
    Object.fromEntries(COINS.map((c) => [c.sym, { value: c.rate, dir: 0, key: 0 }]))
  );
  useEffect(() => {
    const id = setInterval(() => {
      setRates((prev) => {
        const next = { ...prev };
        const pick = COINS[Math.floor(Math.random() * COINS.length)];
        const cur = prev[pick.sym].value;
        const jitter = cur * (Math.random() * 0.004 - 0.002);
        const val = cur + jitter;
        next[pick.sym] = { value: val, dir: jitter >= 0 ? 1 : -1, key: prev[pick.sym].key + 1 };
        return next;
      });
    }, 2600);
    return () => clearInterval(id);
  }, []);
  return rates;
}

function TickerRow({ coin, rate }) {
  return (
    <div className="tick-row">
      <span className="tick-sym">{coin.sym}</span>
      <span className="tick-name">{coin.name}</span>
      <span key={rate.key} className="tick-val flip">
        {naira(rate.value)}
      </span>
      <span className={"tick-dir " + (rate.dir >= 0 ? "up" : "down")}>
        {rate.dir >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
      </span>
    </div>
  );
}

export default function CryptoBuy() {
  const rates = useLiveRates();
  const [mode, setMode] = useState("buy"); // buy | sell
  const [step, setStep] = useState(0);
  const [coinIdx, setCoinIdx] = useState(0);
  const [chain, setChain] = useState(COINS[0].chains[0]);
  const [amount, setAmount] = useState("");
  const [payMethod, setPayMethod] = useState("bank");
  const [wallet, setWallet] = useState("");
  const [bankAcct, setBankAcct] = useState("");
  const [bankName, setBankName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const cardTop = useRef(null);

  const coin = COINS[coinIdx];
  const liveRate = rates[coin.sym].value;
  const gas = GAS[coin.sym];

  useEffect(() => {
    setChain(coin.chains[0]);
  }, [coinIdx]);

  const amt = parseFloat(amount) || 0;

  const calc = useMemo(() => {
    if (mode === "buy") {
      const gross = amt / liveRate;
      const net = Math.max(gross - gas, 0);
      return { gross, net, ngn: amt };
    } else {
      const net = Math.max(amt - gas, 0);
      const ngn = net * liveRate;
      return { gross: amt, net, ngn };
    }
  }, [amt, liveRate, gas, mode]);

  function switchMode(next) {
    setMode(next);
    setAmount("");
    setStep(0);
    setSubmitted(false);
  }

  function goStep(n) {
    setStep(n);
    cardTop.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  const canAdvance = [
    true,
    amt > 0,
    mode === "buy" ? !!payMethod : bankAcct.length >= 10 && bankName.length > 1,
    mode === "buy" ? wallet.length >= 8 : true,
    true,
  ];

  return (
    <div className="cb-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

        .cb-root {
          --ink: #12211d;
          --paper: #f6f4ee;
          --panel: #16221d;
          --panel-2: #1c2b25;
          --jade: #2f9e7a;
          --jade-deep: #1f6b52;
          --gold: #d3a24c;
          --line: #33473e;
          --text: #eef1ec;
          --text-dim: #9db3a9;
          --danger: #d3654c;
          font-family: 'Inter', sans-serif;
          background: var(--ink);
          color: var(--text);
          min-height: 100%;
          padding: 0;
          border-radius: 16px;
          overflow: hidden;
        }
        .cb-root * { box-sizing: border-box; }

        .cb-header {
          padding: 22px 24px 16px;
          border-bottom: 1px solid var(--line);
        }
        .cb-brand {
          display: flex; align-items: baseline; justify-content: space-between;
        }
        .cb-logo {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 700;
          font-size: 21px;
          letter-spacing: -0.01em;
        }
        .cb-logo span { color: var(--jade); }
        .cb-tagline {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: var(--text-dim);
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .ticker-wrap {
          margin-top: 16px;
          border: 1px solid var(--line);
          border-radius: 10px;
          overflow: hidden;
          background: var(--panel);
        }
        .ticker-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--gold);
          padding: 7px 12px;
          border-bottom: 1px solid var(--line);
          background: var(--panel-2);
        }
        .tick-row {
          display: grid;
          grid-template-columns: 44px 1fr auto 20px;
          align-items: center;
          gap: 10px;
          padding: 7px 12px;
          border-bottom: 1px solid var(--line);
        }
        .tick-row:last-child { border-bottom: none; }
        .tick-sym {
          font-family: 'IBM Plex Mono', monospace;
          font-weight: 600;
          font-size: 12px;
          color: var(--text);
        }
        .tick-name { font-size: 12px; color: var(--text-dim); }
        .tick-val {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 13px;
          font-variant-numeric: tabular-nums;
        }
        .tick-val.flip { animation: flipIn 0.4s ease; }
        @keyframes flipIn {
          0% { opacity: 0; transform: translateY(-4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .tick-dir.up { color: var(--jade); }
        .tick-dir.down { color: var(--danger); }
        .tick-dir { display: flex; align-items: center; justify-content: center; }

        .mode-toggle {
          display: flex; gap: 0;
          margin-top: 16px;
          border: 1px solid var(--line);
          border-radius: 10px;
          overflow: hidden;
        }
        .mode-btn {
          flex: 1;
          padding: 10px;
          background: var(--panel);
          border: none;
          color: var(--text-dim);
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .mode-btn.active { background: var(--jade-deep); color: #fff; }
        .mode-btn:first-child { border-right: 1px solid var(--line); }

        .cb-body { display: flex; }
        .rail {
          width: 128px;
          flex-shrink: 0;
          padding: 20px 0;
          border-right: 1px solid var(--line);
        }
        .rail-item {
          padding: 10px 16px;
          border-left: 2px solid transparent;
          cursor: default;
          opacity: 0.45;
        }
        .rail-item.active { border-left-color: var(--gold); opacity: 1; }
        .rail-item.done { opacity: 0.85; cursor: pointer; }
        .rail-num {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          color: var(--text-dim);
        }
        .rail-name {
          font-size: 12.5px;
          font-weight: 500;
          margin-top: 2px;
          display: flex; align-items: center; gap: 5px;
        }

        .cb-panel { flex: 1; padding: 22px 24px 24px; min-width: 0; }
        .panel-title {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 600;
          font-size: 16px;
          margin: 0 0 4px;
        }
        .panel-sub {
          font-size: 12.5px;
          color: var(--text-dim);
          margin: 0 0 16px;
        }

        .coin-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .coin-card {
          border: 1px solid var(--line);
          background: var(--panel);
          border-radius: 10px;
          padding: 10px 12px;
          cursor: pointer;
          display: flex; align-items: center; gap: 10px;
          text-align: left;
        }
        .coin-card.sel { border-color: var(--jade); background: var(--panel-2); }
        .coin-dot {
          width: 30px; height: 30px; border-radius: 50%;
          background: var(--jade-deep);
          display: flex; align-items: center; justify-content: center;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px; font-weight: 600; color: #fff;
          flex-shrink: 0;
        }
        .coin-info .n { font-size: 13px; font-weight: 500; }
        .coin-info .s { font-size: 11px; color: var(--text-dim); font-family: 'IBM Plex Mono', monospace; }

        .chain-row { margin-top: 14px; }
        .field-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10.5px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--text-dim);
          margin-bottom: 8px;
          display: block;
        }
        .chip-set { display: flex; gap: 7px; flex-wrap: wrap; }
        .chip {
          border: 1px solid var(--line);
          background: var(--panel);
          color: var(--text-dim);
          font-size: 12px;
          padding: 6px 12px;
          border-radius: 999px;
          cursor: pointer;
        }
        .chip.sel { border-color: var(--gold); color: var(--gold); background: rgba(211,162,76,0.08); }

        .amt-input-wrap {
          border: 1px solid var(--line);
          border-radius: 10px;
          background: var(--panel);
          padding: 14px 16px;
        }
        .amt-input-wrap input {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          color: var(--text);
          font-family: 'IBM Plex Mono', monospace;
          font-size: 24px;
          font-weight: 500;
        }
        .amt-input-wrap input::placeholder { color: var(--text-dim); opacity: 0.5; }
        .amt-currency { font-size: 11px; color: var(--text-dim); margin-bottom: 4px; }

        .quick-amts { display: flex; gap: 6px; margin-top: 10px; }
        .quick-amts button {
          flex: 1;
          padding: 6px 0;
          border: 1px solid var(--line);
          background: transparent;
          color: var(--text-dim);
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          border-radius: 6px;
          cursor: pointer;
        }
        .quick-amts button:hover { border-color: var(--jade); color: var(--text); }

        .ledger {
          margin-top: 16px;
          border-top: 1px dashed var(--line);
          padding-top: 12px;
        }
        .ledger-row {
          display: flex; justify-content: space-between;
          font-size: 12.5px;
          padding: 5px 0;
          color: var(--text-dim);
        }
        .ledger-row.strong { color: var(--text); font-weight: 600; font-size: 13.5px; }
        .ledger-row span:last-child { font-family: 'IBM Plex Mono', monospace; }

        .pay-opt {
          display: flex; align-items: center; gap: 12px;
          border: 1px solid var(--line);
          background: var(--panel);
          border-radius: 10px;
          padding: 12px 14px;
          margin-bottom: 8px;
          cursor: pointer;
        }
        .pay-opt.sel { border-color: var(--jade); background: var(--panel-2); }
        .pay-opt .ico {
          width: 32px; height: 32px; border-radius: 8px;
          background: var(--jade-deep);
          display: flex; align-items: center; justify-content: center; color: #fff;
          flex-shrink: 0;
        }
        .pay-opt .t { font-size: 13px; font-weight: 500; }
        .pay-opt .d { font-size: 11px; color: var(--text-dim); }

        .text-field {
          width: 100%;
          background: var(--panel);
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 11px 12px;
          color: var(--text);
          font-size: 13px;
          font-family: 'IBM Plex Mono', monospace;
          outline: none;
          margin-bottom: 10px;
        }
        .text-field:focus { border-color: var(--jade); }
        .text-field::placeholder { color: var(--text-dim); opacity: 0.6; }

        .deposit-box {
          border: 1px dashed var(--gold);
          background: rgba(211,162,76,0.06);
          border-radius: 10px;
          padding: 14px;
          display: flex; align-items: center; justify-content: space-between;
          gap: 10px;
        }
        .deposit-box .addr {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12.5px;
          word-break: break-all;
        }
        .copy-btn {
          background: none; border: 1px solid var(--line); border-radius: 6px;
          color: var(--text-dim); padding: 6px; cursor: pointer; flex-shrink: 0;
        }

        .receipt {
          border: 1px solid var(--line);
          border-radius: 10px;
          background: var(--panel);
          padding: 16px;
        }
        .receipt-row {
          display: flex; justify-content: space-between; align-items: baseline;
          font-size: 12.5px;
          padding: 6px 0;
          border-bottom: 1px dotted var(--line);
          color: var(--text-dim);
        }
        .receipt-row:last-child { border-bottom: none; }
        .receipt-row b {
          color: var(--text);
          font-family: 'IBM Plex Mono', monospace;
          font-weight: 500;
        }

        .nav-row {
          display: flex; justify-content: space-between; align-items: center;
          margin-top: 20px;
        }
        .btn {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 600;
          font-size: 13.5px;
          border-radius: 8px;
          padding: 11px 18px;
          border: none;
          cursor: pointer;
          display: flex; align-items: center; gap: 6px;
        }
        .btn.primary { background: var(--jade); color: #0d1a15; }
        .btn.primary:disabled { opacity: 0.35; cursor: not-allowed; }
        .btn.ghost { background: transparent; color: var(--text-dim); }

        .success-wrap {
          text-align: center;
          padding: 20px 10px 6px;
        }
        .stamp {
          display: inline-block;
          border: 2px solid var(--jade);
          color: var(--jade);
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 0.1em;
          padding: 6px 18px;
          border-radius: 6px;
          transform: rotate(-4deg);
          margin-bottom: 14px;
        }
        .order-id {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: var(--text-dim);
        }

        .disclaimer {
          font-size: 10.5px;
          color: var(--text-dim);
          text-align: center;
          padding: 12px 24px 18px;
          opacity: 0.6;
        }

        @media (max-width: 560px) {
          .cb-body { flex-direction: column; }
          .rail { width: 100%; display: flex; overflow-x: auto; padding: 12px; border-right: none; border-bottom: 1px solid var(--line); }
          .rail-item { border-left: none; border-bottom: 2px solid transparent; padding: 6px 10px; flex-shrink: 0; }
          .rail-item.active { border-bottom-color: var(--gold); }
          .coin-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="cb-header" ref={cardTop}>
        <div className="cb-brand">
          <div className="cb-logo">Crypto<span>Buy</span></div>
          <div className="cb-tagline">Naira exchange desk</div>
        </div>

        <div className="ticker-wrap">
          <div className="ticker-label">Live board · NGN</div>
          {COINS.map((c) => (
            <TickerRow key={c.sym} coin={c} rate={rates[c.sym]} />
          ))}
        </div>

        <div className="mode-toggle">
          <button className={"mode-btn" + (mode === "buy" ? " active" : "")} onClick={() => switchMode("buy")}>
            Buy crypto
          </button>
          <button className={"mode-btn" + (mode === "sell" ? " active" : "")} onClick={() => switchMode("sell")}>
            Sell crypto
          </button>
        </div>
      </div>

      <div className="cb-body">
        <div className="rail">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={"rail-item" + (i === step ? " active" : i < step ? " done" : "")}
              onClick={() => i < step && goStep(i)}
            >
              <div className="rail-num">{String(i + 1).padStart(2, "0")}</div>
              <div className="rail-name">
                {i < step && <Check size={11} />}
                {mode === "sell" && s === "Payout" ? "Payout" : mode === "sell" && s === "Destination" ? "Send from" : s}
              </div>
            </div>
          ))}
        </div>

        <div className="cb-panel">
          {submitted ? (
            <div className="success-wrap">
              <div className="stamp">Order logged</div>
              <p style={{ fontSize: 13, marginBottom: 4 }}>
                {mode === "buy"
                  ? `We'll send ${crypto(calc.net, coin.sym)} ${coin.sym} once payment clears.`
                  : `Send us ${crypto(calc.gross, coin.sym)} ${coin.sym} — payout follows on confirmation.`}
              </p>
              <p className="order-id">Ref CB-{Math.floor(100000 + Math.random() * 900000)}</p>
              <div className="nav-row" style={{ justifyContent: "center" }}>
                <button className="btn ghost" onClick={() => { setSubmitted(false); setStep(0); setAmount(""); }}>
                  Start another order
                </button>
              </div>
            </div>
          ) : (
            <>
              {step === 0 && (
                <>
                  <h3 className="panel-title">Choose currency</h3>
                  <p className="panel-sub">Pick the coin you want to {mode}.</p>
                  <div className="coin-grid">
                    {COINS.map((c, i) => (
                      <button key={c.sym} className={"coin-card" + (i === coinIdx ? " sel" : "")} onClick={() => setCoinIdx(i)}>
                        <div className="coin-dot">{c.sym.slice(0, 2)}</div>
                        <div className="coin-info">
                          <div className="n">{c.name}</div>
                          <div className="s">{c.sym}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                  {coin.chains.length > 1 && (
                    <div className="chain-row">
                      <span className="field-label">Network</span>
                      <div className="chip-set">
                        {coin.chains.map((ch) => (
                          <button key={ch} className={"chip" + (ch === chain ? " sel" : "")} onClick={() => setChain(ch)}>
                            {ch}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {step === 1 && (
                <>
                  <h3 className="panel-title">Enter amount</h3>
                  <p className="panel-sub">
                    {mode === "buy" ? `How much Naira do you want to spend?` : `How much ${coin.sym} are you selling?`}
                  </p>
                  <div className="amt-input-wrap">
                    <div className="amt-currency">{mode === "buy" ? "Amount in NGN" : `Amount in ${coin.sym}`}</div>
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  {mode === "buy" && (
                    <div className="quick-amts">
                      {[10000, 25000, 50000, 100000].map((v) => (
                        <button key={v} onClick={() => setAmount(String(v))}>{naira(v)}</button>
                      ))}
                    </div>
                  )}
                  <div className="ledger">
                    <div className="ledger-row">
                      <span>Rate</span>
                      <span>1 {coin.sym} = {naira(liveRate)}</span>
                    </div>
                    <div className="ledger-row">
                      <span>Network fee</span>
                      <span>{crypto(gas, coin.sym)} {coin.sym}</span>
                    </div>
                    <div className="ledger-row strong">
                      <span>{mode === "buy" ? "You receive" : "You receive"}</span>
                      <span>
                        {mode === "buy" ? `${crypto(calc.net, coin.sym)} ${coin.sym}` : naira(calc.ngn)}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {step === 2 && mode === "buy" && (
                <>
                  <h3 className="panel-title">Payment method</h3>
                  <p className="panel-sub">Choose how you'll pay the Naira amount.</p>
                  {[
                    { id: "bank", t: "Bank transfer", d: "Pay via your bank app, confirmed in 1–3 min", icon: <Landmark size={15} /> },
                    { id: "card", t: "Debit card", d: "Instant, small processing fee applies", icon: <CreditCard size={15} /> },
                    { id: "ussd", t: "USSD", d: "Pay from any phone, no data needed", icon: <Smartphone size={15} /> },
                  ].map((p) => (
                    <div key={p.id} className={"pay-opt" + (payMethod === p.id ? " sel" : "")} onClick={() => setPayMethod(p.id)}>
                      <div className="ico">{p.icon}</div>
                      <div>
                        <div className="t">{p.t}</div>
                        <div className="d">{p.d}</div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {step === 2 && mode === "sell" && (
                <>
                  <h3 className="panel-title">Payout account</h3>
                  <p className="panel-sub">Where should we send your Naira?</p>
                  <span className="field-label">Bank name</span>
                  <input className="text-field" placeholder="e.g. GTBank" value={bankName} onChange={(e) => setBankName(e.target.value)} />
                  <span className="field-label">Account number</span>
                  <input className="text-field" placeholder="0123456789" value={bankAcct} onChange={(e) => setBankAcct(e.target.value.replace(/\D/g, ""))} />
                </>
              )}

              {step === 3 && mode === "buy" && (
                <>
                  <h3 className="panel-title">Destination wallet</h3>
                  <p className="panel-sub">Paste the {chain} address that should receive your {coin.sym}.</p>
                  <span className="field-label">Wallet address</span>
                  <input className="text-field" placeholder={`Your ${coin.sym} address`} value={wallet} onChange={(e) => setWallet(e.target.value)} />
                  {wallet.length > 0 && wallet.length < 8 && (
                    <p style={{ fontSize: 11.5, color: "var(--danger)" }}>That address looks too short — double check it.</p>
                  )}
                </>
              )}

              {step === 3 && mode === "sell" && (
                <>
                  <h3 className="panel-title">Send from</h3>
                  <p className="panel-sub">Send exactly {crypto(calc.gross, coin.sym)} {coin.sym} to this deposit address on {chain}.</p>
                  <div className="deposit-box">
                    <span className="addr">cb1{coin.sym.toLowerCase()}q9m2...k7pf3x{coinIdx}9</span>
                    <button className="copy-btn"><Copy size={14} /></button>
                  </div>
                </>
              )}

              {step === 4 && (
                <>
                  <h3 className="panel-title">Confirm order</h3>
                  <p className="panel-sub">Review the details below before you submit.</p>
                  <div className="receipt">
                    <div className="receipt-row"><span>Type</span><b>{mode === "buy" ? "Buy" : "Sell"} {coin.sym}</b></div>
                    <div className="receipt-row"><span>Network</span><b>{chain}</b></div>
                    <div className="receipt-row"><span>Rate</span><b>1 {coin.sym} = {naira(liveRate)}</b></div>
                    {mode === "buy" ? (
                      <>
                        <div className="receipt-row"><span>You pay</span><b>{naira(calc.ngn)}</b></div>
                        <div className="receipt-row"><span>Payment method</span><b>{payMethod === "bank" ? "Bank transfer" : payMethod === "card" ? "Debit card" : "USSD"}</b></div>
                        <div className="receipt-row"><span>Wallet</span><b>{wallet ? wallet.slice(0, 6) + "…" + wallet.slice(-4) : "—"}</b></div>
                        <div className="receipt-row"><span>You receive</span><b>{crypto(calc.net, coin.sym)} {coin.sym}</b></div>
                      </>
                    ) : (
                      <>
                        <div className="receipt-row"><span>You send</span><b>{crypto(calc.gross, coin.sym)} {coin.sym}</b></div>
                        <div className="receipt-row"><span>Payout to</span><b>{bankName || "—"} · {bankAcct || "—"}</b></div>
                        <div className="receipt-row"><span>You receive</span><b>{naira(calc.ngn)}</b></div>
                      </>
                    )}
                  </div>
                </>
              )}

              <div className="nav-row">
                <button className="btn ghost" onClick={() => step > 0 && goStep(step - 1)} style={{ visibility: step === 0 ? "hidden" : "visible" }}>
                  <ChevronLeft size={15} /> Back
                </button>
                {step < STEPS.length - 1 ? (
                  <button className="btn primary" disabled={!canAdvance[step]} onClick={() => goStep(step + 1)}>
                    Continue <ChevronRight size={15} />
                  </button>
                ) : (
                  <button className="btn primary" onClick={() => setSubmitted(true)}>
                    <ArrowLeftRight size={14} /> Confirm & submit
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="disclaimer">
        Rates shown are illustrative for this prototype, not live market data.
      </div>
    </div>
  );
}
