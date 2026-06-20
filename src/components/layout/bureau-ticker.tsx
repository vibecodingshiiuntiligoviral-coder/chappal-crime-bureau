import { BUREAU_TICKER_BULLETINS } from "@/lib/constants";

export function BureauTicker() {
  const items = [...BUREAU_TICKER_BULLETINS, ...BUREAU_TICKER_BULLETINS];

  return (
    <div className="bureau-ticker" aria-label="Public alert ticker">
      <div className="bureau-ticker-pill">PUBLIC ALERT</div>
      <div className="bureau-ticker-viewport">
        <div className="bureau-ticker-track">
          {items.map((item, index) => (
            <span key={`${index}-${item}`} className="bureau-ticker-item">
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
