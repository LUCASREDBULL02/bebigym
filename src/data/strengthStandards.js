// Fully compatible StrengthLevel-style standards for YOUR 7 muscle groups only

export const STRENGTH_STANDARDS = {
  // CHEST
  bench: {
    coeff: 0.8,
    muscles: ["chest", "shoulders", "arms"],
  },
  inclinebench: {
    coeff: 0.75,
    muscles: ["chest", "shoulders", "arms"],
  },
  dumbbellpress: {
    coeff: 0.55,
    muscles: ["chest", "shoulders"],
  },
  cablefly: {
    coeff: 0.35,
    muscles: ["chest"],
  },
  chestpress: {
    coeff: 0.6,
    muscles: ["chest", "shoulders"],
  },
  pushups: {
    coeff: 0.3,
    muscles: ["chest", "shoulders", "arms"],
  },

  // BACK
  row: {
    coeff: 0.9,
    muscles: ["back"],
  },
  latpulldown: {
    coeff: 0.9,
    muscles: ["back", "arms"],
  },
  deadlift: {
    coeff: 1.5,
    muscles: ["back", "glutes", "legs"],
  },
  kelsoshrug: {
    coeff: 0.8,
    muscles: ["back"],
  },
  tbarrow: {
    coeff: 1.0,
    muscles: ["back"],
  },
  meadowsrow: {
    coeff: 0.9,
    muscles: ["back"],
  },
  pendlayrow: {
    coeff: 1.1,
    muscles: ["back"],
  },

  // GLUTES
  hipthrust: {
    coeff: 1.8,
    muscles: ["glutes"],
  },
  smithhipthrust: {
    coeff: 1.6,
    muscles: ["glutes"],
  },
  frogpump: {
    coeff: 0.7,
    muscles: ["glutes"],
  },
  glutebridge: {
    coeff: 1.4,
    muscles: ["glutes"],
  },
  cablekickback: {
    coeff: 0.4,
    muscles: ["glutes"],
  },
  bulgarian: {
    coeff: 0.9,
    muscles: ["glutes", "legs"],
  },
  sumosquat: {
    coeff: 1.2,
    muscles: ["glutes", "legs"],
  },

  // LEGS
  squat: {
    coeff: 1.25,
    muscles: ["legs", "glutes"],
  },
  frontsquat: {
    coeff: 1.0,
    muscles: ["legs", "glutes"],
  },
  legpress: {
    coeff: 3.0,
    muscles: ["legs", "glutes"],
  },
  legcurl: {
    coeff: 0.6,
    muscles: ["legs"],
  },
  legextension: {
    coeff: 0.35,
    muscles: ["legs"],
  },
  hacklift: {
    coeff: 1.5,
    muscles: ["legs", "glutes"],
  },
  sissysquat: {
    coeff: 0.3,
    muscles: ["legs"],
  },
  lunges: {
    coeff: 0.7,
    muscles: ["legs", "glutes"],
  },
  stepup: {
    coeff: 0.5,
    muscles: ["legs", "glutes"],
  },

  // SHOULDERS
  ohp: {
    coeff: 0.6,
    muscles: ["shoulders", "arms"],
  },
  laterals: {
    coeff: 0.25,
    muscles: ["shoulders"],
  },
  frontraise: {
    coeff: 0.15,
    muscles: ["shoulders"],
  },
  "rear-delt-fly": {
    coeff: 0.15,
    muscles: ["shoulders"],
  },
  arnoldpress: {
    coeff: 0.5,
    muscles: ["shoulders", "arms"],
  },

  // ARMS
  bicepcurl: {
    coeff: 0.25,
    muscles: ["arms"],
  },
  hammercurl: {
    coeff: 0.3,
    muscles: ["arms"],
  },
  triceppushdown: {
    coeff: 0.3,
    muscles: ["arms"],
  },
  skullcrusher: {
    coeff: 0.35,
    muscles: ["arms"],
  },
  cablecurl: {
    coeff: 0.25,
    muscles: ["arms"],
  },
  overheadtricep: {
    coeff: 0.35,
    muscles: ["arms"],
  },

  // CORE
  plank: {
    coeff: 0.1,
    muscles: ["core"],
  },
  cablecrunch: {
    coeff: 0.3,
    muscles: ["core"],
  },
  abwheel: {
    coeff: 0.2,
    muscles: ["core"],
  },
  hanginglegraise: {
    coeff: 0.25,
    muscles: ["core"],
  },
};
