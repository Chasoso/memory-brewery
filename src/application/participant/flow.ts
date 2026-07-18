import type {
  BrewingRecipe,
  GestureSummary,
  ParticipantInput,
} from "../../domain/brewing/schemas";

export type ParticipantStep =
  "intro" | "initial" | "odori" | "naka" | "tome" | "result";

export type ParticipantFlowState = {
  step: ParticipantStep;
  colorToken: ParticipantInput["initial"]["colorToken"];
  gesture: GestureSummary;
  landMemoryId: string | undefined;
  scenario: ParticipantInput["tome"]["scenario"];
  freeText: string;
  recipe: BrewingRecipe | undefined;
};

export type ParticipantFlowAction =
  | { type: "start" }
  | { type: "set-color"; colorToken: ParticipantFlowState["colorToken"] }
  | { type: "set-gesture"; gesture: GestureSummary }
  | { type: "start-odori" }
  | { type: "finish-odori" }
  | { type: "set-land"; landMemoryId: string }
  | { type: "to-tome" }
  | {
      type: "set-scenario";
      scenario: NonNullable<ParticipantFlowState["scenario"]>;
    }
  | { type: "set-free-text"; freeText: string }
  | { type: "set-result"; recipe: BrewingRecipe }
  | { type: "back" }
  | { type: "reset" };

export const initialParticipantFlowState: ParticipantFlowState = {
  step: "intro",
  colorToken: "ferment",
  gesture: { kind: "none" },
  landMemoryId: undefined,
  scenario: undefined,
  freeText: "",
  recipe: undefined,
};

export function participantFlowReducer(
  state: ParticipantFlowState,
  action: ParticipantFlowAction,
): ParticipantFlowState {
  switch (action.type) {
    case "start":
      return state.step === "intro" ? { ...state, step: "initial" } : state;
    case "set-color":
      return state.step === "initial"
        ? { ...state, colorToken: action.colorToken }
        : state;
    case "set-gesture":
      return state.step === "initial"
        ? { ...state, gesture: action.gesture }
        : state;
    case "start-odori":
      return state.step === "initial" && state.gesture.kind === "summary"
        ? { ...state, step: "odori" }
        : state;
    case "finish-odori":
      return state.step === "odori" ? { ...state, step: "naka" } : state;
    case "set-land":
      return state.step === "naka"
        ? { ...state, landMemoryId: action.landMemoryId }
        : state;
    case "to-tome":
      return state.step === "naka" && state.landMemoryId !== undefined
        ? { ...state, step: "tome" }
        : state;
    case "set-scenario":
      return state.step === "tome"
        ? { ...state, scenario: action.scenario, freeText: "" }
        : state;
    case "set-free-text":
      return state.step === "tome"
        ? { ...state, freeText: action.freeText, scenario: undefined }
        : state;
    case "set-result":
      return state.step === "tome"
        ? { ...state, step: "result", recipe: action.recipe }
        : state;
    case "back":
      return goBack(state);
    case "reset":
      return initialParticipantFlowState;
  }
}

function goBack(state: ParticipantFlowState): ParticipantFlowState {
  switch (state.step) {
    case "initial":
      return { ...state, step: "intro" };
    case "odori":
      return { ...state, step: "initial" };
    case "naka":
      return { ...state, step: "initial" };
    case "tome":
      return { ...state, step: "naka" };
    default:
      return state;
  }
}
