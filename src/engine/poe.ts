import type { PoePrediction, PoeState } from "./types";

/**
 * POE Pre-activation Lock — Master Spec §2.3
 *
 * State machine, applied in EVERY interactive stage (1–4):
 *  - Any socket mutation → Run button hard-locked (disabled = true)
 *  - Player must click a prediction: [ Higher ↑ ] or [ Lower ↓ ]
 *  - Only then does Run unlock. Right/wrong doesn't matter — the point
 *    is forcing one causal guess per submission.
 */
export type PoeAction =
  | { type: "SOCKET_CHANGED" }
  | { type: "PREDICTION_MADE"; prediction: PoePrediction }
  | { type: "RUN_CONSUMED" }
  | { type: "RESET" };

export const initialPoeState: PoeState = { locked: true, prediction: null };

export function poeReducer(state: PoeState, action: PoeAction): PoeState {
  switch (action.type) {
    case "SOCKET_CHANGED":
      // Hard lock the instant socket content changes (add OR swap)
      return { locked: true, prediction: null };
    case "PREDICTION_MADE":
      return { locked: false, prediction: action.prediction };
    case "RUN_CONSUMED":
      // After a run, next change must be re-predicted
      return { locked: true, prediction: null };
    case "RESET":
      return initialPoeState;
    default:
      return state;
  }
}

/** QA-01 assertion helper: button.disabled === poe.locked, always. */
export function isRunDisabled(state: PoeState, socketsEmpty: boolean): boolean {
  return socketsEmpty || state.locked;
}
