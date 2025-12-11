export const EXERCISES = [
  { id: "bench", name: "Bench Press", muscles: ["chest", "frontdelts", "triceps"] },
  { id: "inclinebench", name: "Incline Bench Press", muscles: ["chest", "frontdelts", "triceps"] },
  { id: "declinebench", name: "Decline Bench Press", muscles: ["chest", "frontdelts"] },
  { id: "dumbbellbench", name: "Dumbbell Bench Press", muscles: ["chest", "frontdelts"] },
  { id: "dumbbellincline", name: "Dumbbell Incline Press", muscles: ["chest", "frontdelts"] },
  { id: "machinechestpress", name: "Machine Chest Press", muscles: ["chest", "frontdelts"] },
  { id: "cablefly", name: "Cable Fly", muscles: ["chest"] },
  { id: "pecdeck", name: "Pec Deck", muscles: ["chest"] },

  { id: "squat", name: "Back Squat", muscles: ["quads", "glutes", "hamstrings"] },
  { id: "frontsquat", name: "Front Squat", muscles: ["quads", "core"] },
  { id: "bulgariansplit", name: "Bulgarian Split Squat", muscles: ["glutes", "quads"] },
  { id: "legpress", name: "Leg Press", muscles: ["quads", "glutes"] },
  { id: "hackSquat", name: "Hack Squat", muscles: ["quads", "glutes"] },
  { id: "gobletsquat", name: "Goblet Squat", muscles: ["quads", "glutes"] },
  { id: "ssbsquat", name: "Safety Bar Squat", muscles: ["quads", "glutes"] },

  { id: "deadlift", name: "Deadlift", muscles: ["hamstrings", "back", "glutes"] },
  { id: "sumodeadlift", name: "Sumo Deadlift", muscles: ["glutes", "hamstrings", "back"] },
  { id: "romaniandeadlift", name: "Romanian Deadlift", muscles: ["hamstrings", "glutes"] },
  { id: "stifflegdeadlift", name: "Stiff Leg Deadlift", muscles: ["hamstrings"] },
  { id: "rackpull", name: "Rack Pull", muscles: ["back", "traps"] },

  { id: "hipthrust", name: "Hip Thrust", muscles: ["glutes"] },
  { id: "smithhipthrust", name: "Smith Machine Hip Thrust", muscles: ["glutes"] },
  { id: "glutebridge", name: "Glute Bridge", muscles: ["glutes"] },
  { id: "frogpump", name: "Frog Pump", muscles: ["glutes"] },

  { id: "latpulldown", name: "Lat Pulldown", muscles: ["lats", "biceps"] },
  { id: "seatedrow", name: "Seated Row", muscles: ["upperback", "lats"] },
  { id: "tbarrow", name: "T-Bar Row", muscles: ["upperback", "lats"] },
  { id: "dumbbellrow", name: "Dumbbell Row", muscles: ["lats", "upperback"] },
  { id: "kelsoshrug", name: "Kelso Shrug", muscles: ["upperback", "traps"] },
  { id: "barbellrow", name: "Barbell Row", muscles: ["upperback", "lats"] },
  { id: "chins", name: "Chin-Up", muscles: ["biceps", "lats"] },
  { id: "pullup", name: "Pull-Up", muscles: ["upperback", "lats"] },

  { id: "shoulderpress", name: "Shoulder Press", muscles: ["shoulders", "triceps"] },
  { id: "arnoldpress", name: "Arnold Press", muscles: ["shoulders"] },
  { id: "laterals", name: "Lateral Raise", muscles: ["shoulders"] },
  { id: "frontraise", name: "Front Raise", muscles: ["frontdelts"] },
  { id: "reardeltfly", name: "Rear Delt Fly", muscles: ["rear-delts"] },
  { id: "facepull", name: "Face Pull", muscles: ["rear-delts", "upperback"] },

  { id: "bicepcurl", name: "Bicep Curl", muscles: ["biceps"] },
  { id: "hammercurl", name: "Hammer Curl", muscles: ["biceps"] },
  { id: "preachercurl", name: "Preacher Curl", muscles: ["biceps"] },
  { id: "cablecurl", name: "Cable Curl", muscles: ["biceps"] },

  { id: "triceppushdown", name: "Tricep Pushdown", muscles: ["triceps"] },
  { id: "skullcrusher", name: "Skull Crusher", muscles: ["triceps"] },
  { id: "overheadtriceps", name: "Overhead Triceps Extension", muscles: ["triceps"] },

  { id: "legcurl", name: "Leg Curl", muscles: ["hamstrings"] },
  { id: "legextension", name: "Leg Extension", muscles: ["quads"] },
  { id: "calfraises", name: "Calf Raises", muscles: ["calves"] },

  { id: "plank", name: "Plank", muscles: ["abs"] },
  { id: "crunch", name: "Crunch", muscles: ["abs"] },
  { id: "cablecrunch", name: "Cable Crunch", muscles: ["abs"] },
  { id: "hanginglegraise", name: "Hanging Leg Raise", muscles: ["abs"] },

  { id: "hipabductor", name: "Hip Abductor", muscles: ["glutes"] },
  { id: "hipadductor", name: "Hip Adductor", muscles: ["innerthigh"] },

  { id: "smithsquat", name: "Smith Machine Squat", muscles: ["quads", "glutes"] },
  { id: "smithlunge", name: "Smith Machine Lunge", muscles: ["quads", "glutes"] },

  { id: "reversehyper", name: "Reverse Hyper", muscles: ["glutes", "hamstrings"] },
  { id: "backextension", name: "Back Extension", muscles: ["hamstrings", "glutes", "lowerback"] },

  { id: "rdl_dumbbell", name: "Dumbbell RDL", muscles: ["hamstrings", "glutes"] },

  { id: "stepup", name: "Step-Up", muscles: ["glutes", "quads"] },
  { id: "lunges", name: "Lunges", muscles: ["glutes", "quads"] },

  { id: "goodmorning", name: "Good Morning", muscles: ["hamstrings", "glutes"] },

  { id: "pullover", name: "Pullover", muscles: ["lats", "chest"] },
  { id: "machinefly", name: "Machine Fly", muscles: ["chest"] },

  { id: "zerchersquat", name: "Zercher Squat", muscles: ["quads", "core"] },
  { id: "beltSquat", name: "Belt Squat", muscles: ["quads", "glutes"] },
  { id: "landminesquat", name: "Landmine Squat", muscles: ["quads", "glutes"] },
];
// ------ CONTINUED EXERCISES LIST ------
export const EXERCISES = [
  ...EXERCISES, //

  // fortsättning på övningarna här
];

  { id: "closegripbench", name: "Close-Grip Bench Press", muscles: ["triceps", "chest"] },
  { id: "jmpress", name: "JM Press", muscles: ["triceps"] },

  { id: "machineRow", name: "Machine Row", muscles: ["upperback", "lats"] },
  { id: "widegriplatpulldown", name: "Wide-Grip Lat Pulldown", muscles: ["lats"] },
  { id: "closegriplatpulldown", name: "Close-Grip Lat Pulldown", muscles: ["lats", "biceps"] },

  { id: "singlearmrow", name: "Single-Arm Row", muscles: ["lats", "upperback"] },
  { id: "meadowrow", name: "Meadow Row", muscles: ["lats", "upperback", "rear-delts"] },

  { id: "cableRow", name: "Cable Row", muscles: ["upperback", "lats"] },
  { id: "highrow", name: "High Row", muscles: ["upperback", "rear-delts"] },

  { id: "uprightrow", name: "Upright Row", muscles: ["traps", "shoulders"] },

  { id: "shrugs", name: "Barbell Shrugs", muscles: ["traps"] },
  { id: "dumbbellshrugs", name: "Dumbbell Shrugs", muscles: ["traps"] },

  // ---- Shoulder isolation ----
  { id: "cablelateralraise", name: "Cable Lateral Raise", muscles: ["shoulders"] },
  { id: "machineLateralRaise", name: "Machine Lateral Raise", muscles: ["shoulders"] },
  { id: "reversepecdeck", name: "Reverse Pec Deck", muscles: ["rear-delts"] },

  { id: "smithshoulderpress", name: "Smith Machine Shoulder Press", muscles: ["shoulders", "triceps"] },

  // ---- Arm variations ----
  { id: "concentrationcurl", name: "Concentration Curl", muscles: ["biceps"] },
  { id: "inclinecurl", name: "Incline Dumbbell Curl", muscles: ["biceps"] },
  { id: "reversecurl", name: "Reverse Curl", muscles: ["biceps", "forearms"] },
  { id: "zottomancurl", name: "Zottman Curl", muscles: ["biceps", "forearms"] },
  { id: "spidercurl", name: "Spider Curl", muscles: ["biceps"] },

  { id: "frenchpress", name: "French Press", muscles: ["triceps"] },
  { id: "ropepushdown", name: "Rope Pushdown", muscles: ["triceps"] },
  { id: "kickback", name: "Triceps Kickback", muscles: ["triceps"] },

  // ---- Glutes / Legs advanced ----
  { id: "hipabduction", name: "Hip Abduction Machine", muscles: ["glutes"] },
  { id: "cablekickback", name: "Cable Kickback", muscles: ["glutes"] },
  { id: "glutefocusedstepup", name: "Glute-Focused Step-Up", muscles: ["glutes"] },
  { id: "curtsyLunge", name: "Curtsy Lunge", muscles: ["glutes", "quads"] },
  { id: "walkinglunge", name: "Walking Lunge", muscles: ["glutes", "quads"] },

  { id: "kneelinghipthrust", name: "Kneeling Hip Thrust", muscles: ["glutes"] },
  { id: "cablepullthrough", name: "Cable Pull Through", muscles: ["glutes", "hamstrings"] },
  { id: "smithrdl", name: "Smith Machine RDL", muscles: ["hamstrings", "glutes"] },

  { id: "legpresshighfeet", name: "Leg Press (High Feet)", muscles: ["glutes", "hamstrings"] },
  { id: "legpresslowfeet", name: "Leg Press (Low Feet)", muscles: ["quads"] },

  { id: "seatedcalfraise", name: "Seated Calf Raise", muscles: ["calves"] },
  { id: "standingcalfraise", name: "Standing Calf Raise", muscles: ["calves"] },

  // ---- Core advanced ----
  { id: "sideplank", name: "Side Plank", muscles: ["abs"] },
  { id: "weightedplank", name: "Weighted Plank", muscles: ["abs"] },
  { id: "vups", name: "V-Ups", muscles: ["abs"] },
  { id: "mountainclimber", name: "Mountain Climbers", muscles: ["abs"] },
  { id: "russiantwist", name: "Russian Twist", muscles: ["abs"] },

  { id: "legraises", name: "Leg Raises", muscles: ["abs"] },
  { id: "toetobar", name: "Toes to Bar", muscles: ["abs"] },

  // ---- Back isolation ----
  { id: "straightarmPulldown", name: "Straight-Arm Pulldown", muscles: ["lats"] },
  { id: "chestSupportedRow", name: "Chest-Supported Row", muscles: ["upperback", "lats"] },

  { id: "sealrow", name: "Seal Row", muscles: ["upperback", "rear-delts", "lats"] },

  // ---- Machine variants ----
  { id: "smithbench", name: "Smith Bench Press", muscles: ["chest", "triceps", "frontdelts"] },
  { id: "smithincline", name: "Smith Incline Press", muscles: ["chest", "frontdelts"] },

  // ---- Hamstring curls ----
  { id: "lyinglegcurl", name: "Lying Leg Curl", muscles: ["hamstrings"] },
  { id: "seatedlegcurl", name: "Seated Leg Curl", muscles: ["hamstrings"] },

  // ---- Plyometrics ----
  { id: "boxjump", name: "Box Jump", muscles: ["quads", "glutes", "calves"] },
  { id: "jumpSquat", name: "Jump Squat", muscles: ["quads", "glutes"] },

  // ---- Landmine ----
  { id: "landminepress", name: "Landmine Press", muscles: ["shoulders", "frontdelts"] },
  { id: "landminerow", name: "Landmine Row", muscles: ["lats", "upperback"] },
  { id: "landminerotation", name: "Landmine Rotation", muscles: ["core"] },

  // ---- Chest isolation ----
  { id: "lowcablefly", name: "Low Cable Fly", muscles: ["chest"] },
  { id: "highcablefly", name: "High Cable Fly", muscles: ["chest"] },

  // ---- Rear delt / upperback ----
  { id: "bentreraised", name: "Bent Rear Delt Raise", muscles: ["rear-delts"] },
  { id: "cablereardelt", name: "Cable Rear Delt Fly", muscles: ["rear-delts"] },

  // ---- Split squat variants ----
  { id: "frontfootraisedbss", name: "Front-Foot Elevated Split Squat", muscles: ["glutes", "quads"] },
  { id: "rearfootraisedbss", name: "Rear-Foot Elevated Split Squat", muscles: ["glutes", "quads"] },

  // ---- Advanced glute ----
  { id: "smithkickback", name: "Smith Kickback", muscles: ["glutes"] },
  { id: "glutefocusedlegpress", name: "Glute-Focused Leg Press", muscles: ["glutes"] },
  { id: "bandedhipthrust", name: "Banded Hip Thrust", muscles: ["glutes"] },

];
// ------ FINAL PART ------
export const EXERCISES = [

  // --- Additional athletic & hypertrophy movements ---
  { id: "sledpush", name: "Sled Push", muscles: ["quads", "glutes", "calves"] },
  { id: "sledpull", name: "Sled Pull", muscles: ["hamstrings", "glutes"] },

  { id: "hipcirclewalk", name: "Hip Circle Walks", muscles: ["glutes"] },
  { id: "monsterwalk", name: "Monster Walks", muscles: ["glutes"] },

  { id: "smithcalfraise", name: "Smith Calf Raise", muscles: ["calves"] },

  // --- Cable legs ---
  { id: "cableabduction", name: "Cable Abduction", muscles: ["glutes"] },
  { id: "cableadduction", name: "Cable Adduction", muscles: ["innerthigh"] },

  // --- Core machines & cables ---
  { id: "abcrunchmachine", name: "Ab Crunch Machine", muscles: ["abs"] },
  { id: "obliquecablecrunch", name: "Oblique Cable Crunch", muscles: ["abs"] },

  // ---- More rows ----
  { id: "kneelingsinglearmrow", name: "Kneeling Single Arm Row", muscles: ["lats"] },
  { id: "neutralgriprow", name: "Neutral Grip Row", muscles: ["upperback", "lats"] },

  // ---- Chest supported variations ----
  { id: "inclinepronerow", name: "Incline Prone Row", muscles: ["upperback", "rear-delts"] },

  { id: "dualropelatpulldown", name: "Dual Rope Lat Pulldown", muscles: ["lats"] },

  // ---- Chest machine variations ----
  { id: "horizontalchestpress", name: "Horizontal Chest Press", muscles: ["chest"] },
  { id: "verticalchestpress", name: "Vertical Chest Press", muscles: ["chest"] },

  // --- Shoulder machines ---
  { id: "shoulderpressmachine", name: "Shoulder Press Machine", muscles: ["shoulders", "triceps"] },

  // --- Advanced quads ---
  { id: "cyclistsquat", name: "Cyclist Squat", muscles: ["quads"] },
  { id: "heelsElevatedSquat", name: "Heels-Elevated Squat", muscles: ["quads"] },

  { id: "stepdown", name: "Step Down", muscles: ["quads", "glutes"] },

  { id: "kneeraises", name: "Knee Raises", muscles: ["abs"] },

  // --- Hamstring intensity ---
  { id: "nordiccurls", name: "Nordic Curl", muscles: ["hamstrings"] },

  // --- Strong curves style ----
  { id: "kickbackmachine", name: "Kickback Machine", muscles: ["glutes"] },
  { id: "abductionmachine", name: "Abduction Machine", muscles: ["glutes"] },

  // --- More glute builders ---
  { id: "cablehipthrust", name: "Cable Hip Thrust", muscles: ["glutes"] },
  { id: "smithstepup", name: "Smith Step-Up", muscles: ["glutes", "quads"] },

  { id: "barbellglutebridge", name: "Barbell Glute Bridge", muscles: ["glutes"] },

  // --- Reverse movements ---
  { id: "reverseLunge", name: "Reverse Lunge", muscles: ["glutes", "quads"] },
  { id: "forwardLunge", name: "Forward Lunge", muscles: ["quads", "glutes"] },

  { id: "smithreverseLunge", name: "Smith Reverse Lunge", muscles: ["quads", "glutes"] },

  // ---- Band work ----
  { id: "bandwalk", name: "Band Walk", muscles: ["glutes"] },
  { id: "bandkickback", name: "Band Kickback", muscles: ["glutes"] },

  // ---- Upper back isolation ----
  { id: "scapularretraction", name: "Scapular Retraction", muscles: ["upperback", "traps"] },

  // ---- Olympic & power ----
  { id: "powerclean", name: "Power Clean", muscles: ["back", "glutes", "legs"] },
  { id: "snatchpull", name: "Snatch Pull", muscles: ["back", "traps", "legs"] },

  // ---- Forearms ----
  { id: "wristcurl", name: "Wrist Curl", muscles: ["forearms"] },
  { id: "reversewristcurl", name: "Reverse Wrist Curl", muscles: ["forearms"] },

  // ---- Rotator cuff ----
  { id: "externalrotation", name: "External Rotation", muscles: ["shoulders"] },
  { id: "internalrotation", name: "Internal Rotation", muscles: ["shoulders"] },

  // ---- Athletic ----
  { id: "broadjump", name: "Broad Jump", muscles: ["quads", "glutes"] },

  // ---- Extra cable variations ----
  { id: "cableuprightrow", name: "Cable Upright Row", muscles: ["traps", "shoulders"] },
  { id: "cablefrontraise", name: "Cable Front Raise", muscles: ["frontdelts"] },
  { id: "cablerearrese", name: "Cable Rear Raise", muscles: ["rear-delts"] },

  { id: "machineabduction", name: "Machine Abduction", muscles: ["glutes"] },

  // ---- Final additions ----
  { id: "hipthrustsmith", name: "Smith Hip Thrust", muscles: ["glutes"] },
  { id: "kneelinglegcurl", name: "Kneeling Leg Curl", muscles: ["hamstrings"] },
  { id: "donkeycalf", name: "Donkey Calf Raise", muscles: ["calves"] },

  { id: "glutehyper", name: "Glute Hyper", muscles: ["glutes"] },

  { id: "vikingpress", name: "Viking Press", muscles: ["shoulders", "triceps"] },

  { id: "latprayer", name: "Lat Prayers", muscles: ["lats"] },

  { id: "dragcurl", name: "Drag Curl", muscles: ["biceps"] },

  { id: "suitcasecarry", name: "Suitcase Carry", muscles: ["core"] },
  { id: "farmercarry", name: "Farmer Carry", muscles: ["core", "forearms", "traps"] },

  // ----- DONE: 220 övningar -----
];
