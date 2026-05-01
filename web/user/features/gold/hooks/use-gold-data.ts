"use client";

import { useGoldRate } from "../api/get-gold-rate";
import { useGoldHistory } from "../api/get-history";
import type { RateRange } from "../types";

/** Convenience wrapper combining live rate + history for dashboards. */
export function useGoldData(range: RateRange = "1w") {
  const rate = useGoldRate();
  const history = useGoldHistory(range);
  return { rate, history };
}
