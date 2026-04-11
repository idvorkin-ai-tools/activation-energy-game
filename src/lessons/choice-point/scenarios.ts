import type { Scenario } from "./types";

/**
 * 25 scenarios across four categories.
 * Sourced from act.md lines 107, 145, 172, 215-220, 359-381, 441-448.
 */
export const ALL_SCENARIOS: Scenario[] = [
  // Obvious towards moves
  { id: "gym-planned", text: "Going to the gym you planned the night before.", category: "obvious-towards", defaultSide: "towards", ambiguous: false },
  { id: "text-sister", text: "Texting your sister back about her birthday.", category: "obvious-towards", defaultSide: "towards", ambiguous: false },
  { id: "open-email", text: "Opening the hard email and reading it.", category: "obvious-towards", defaultSide: "towards", ambiguous: false },
  { id: "call-doctor", text: "Calling the doctor about the thing you've been ignoring.", category: "obvious-towards", defaultSide: "towards", ambiguous: false },
  { id: "say-no", text: "Saying no to the meeting you shouldn't have been invited to.", category: "obvious-towards", defaultSide: "towards", ambiguous: false },
  { id: "phone-away", text: "Putting your phone in another room and reading a book.", category: "obvious-towards", defaultSide: "towards", ambiguous: false },

  // Obvious away moves
  { id: "scroll-avoid", text: "Scrolling for 45 minutes to avoid starting the report.", category: "obvious-away", defaultSide: "away", ambiguous: false },
  { id: "third-drink", text: "Pouring a third drink because the day sucked.", category: "obvious-away", defaultSide: "away", ambiguous: false },
  { id: "cancel-plan", text: "Cancelling the plan at 6pm because you \"don't feel like it.\"", category: "obvious-away", defaultSide: "away", ambiguous: false },
  { id: "reread-slack", text: "Re-reading the angry Slack message for the tenth time.", category: "obvious-away", defaultSide: "away", ambiguous: false },
  { id: "late-email", text: "Checking email at 11:47pm for the fourth time.", category: "obvious-away", defaultSide: "away", ambiguous: false },
  { id: "cookies", text: "Eating a whole sleeve of cookies standing up in the kitchen.", category: "obvious-away", defaultSide: "away", ambiguous: false },

  // Ambiguous — function, not form
  { id: "tv-season", text: "Watching a whole season of a show on a Saturday.", category: "ambiguous", defaultSide: null, ambiguous: true },
  { id: "long-run", text: "Going for a long run.", category: "ambiguous", defaultSide: null, ambiguous: true },
  { id: "todo-list", text: "Making a to-do list for the project.", category: "ambiguous", defaultSide: null, ambiguous: true },
  { id: "wine-dinner", text: "Having a glass of wine with dinner.", category: "ambiguous", defaultSide: null, ambiguous: true },
  { id: "news", text: "Reading about the news.", category: "ambiguous", defaultSide: null, ambiguous: true },
  { id: "clean-kitchen", text: "Cleaning the entire kitchen instead of writing.", category: "ambiguous", defaultSide: null, ambiguous: true },
  { id: "therapy", text: "Going to therapy.", category: "ambiguous", defaultSide: null, ambiguous: true },
  { id: "long-nap", text: "Taking a long nap in the afternoon.", category: "ambiguous", defaultSide: null, ambiguous: true },
  { id: "call-mom", text: "Calling your mom.", category: "ambiguous", defaultSide: null, ambiguous: true },

  // Covert behaviors
  { id: "notice-anger", text: "Noticing the anger and letting it be there.", category: "covert", defaultSide: "towards", ambiguous: true },
  { id: "rehearse-argument", text: "Rehearsing tomorrow's argument for the twelfth time.", category: "covert", defaultSide: "away", ambiguous: true },
  { id: "not-good-enough", text: "Silently telling yourself \"I'm not good enough.\"", category: "covert", defaultSide: "away", ambiguous: true },
  { id: "having-thought", text: "\"I'm having the thought that I can't do this.\"", category: "covert", defaultSide: "towards", ambiguous: true },
];

/** Reflection-beat question variants. `{X}` is replaced with tile text. */
export const REFLECTION_QUESTIONS = [
  "You routed '{X}' as {SIDE}. Are you sure?",
  "Did '{X}' move you toward the life you want? Or away from something you didn't want to feel?",
  "That one went fast. '{X}' — take another look.",
  "'{X}' — was that you moving toward something, or you running from something?",
  "Any activity can be either. What matters is the function, not the form. What was the function of '{X}' for you?",
];

/**
 * Build the 22-tile scenario list for one playthrough.
 * Wave 1: 6 mostly obvious + 1 ambiguous at the end
 * Wave 2: 8 mix of obvious and ambiguous, first covert near the end
 * Wave 3: 8 mostly ambiguous and covert
 */
export function buildRunScenarios(): Scenario[] {
  const byCategory = (cat: Scenario["category"]) => ALL_SCENARIOS.filter((s) => s.category === cat);
  const shuffle = <T,>(arr: T[]): T[] => {
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };

  const towards = shuffle(byCategory("obvious-towards"));
  const away = shuffle(byCategory("obvious-away"));
  const ambig = shuffle(byCategory("ambiguous"));
  const covert = shuffle(byCategory("covert"));

  const wave1: Scenario[] = [
    towards[0], away[0], towards[1], away[1], towards[2], ambig[0],
  ];
  const wave2: Scenario[] = [
    away[2], towards[3], ambig[1], away[3], ambig[2], towards[4], covert[0], ambig[3],
  ];
  const wave3: Scenario[] = [
    ambig[4], covert[1], ambig[5], covert[2], ambig[6], away[4], covert[3], ambig[7],
  ];

  return [...wave1, ...wave2, ...wave3];
}

/** Pick a reflection question for a given scenario + routing side. */
export function pickReflectionQuestion(scenario: Scenario, side: "away" | "towards"): string {
  const template = REFLECTION_QUESTIONS[Math.floor(Math.random() * REFLECTION_QUESTIONS.length)];
  const sideLabel = side === "towards" ? "Towards" : "Away";
  return template.replace("{X}", scenario.text.replace(/\.$/, "")).replace("{SIDE}", sideLabel);
}
