export const TEAMS = {
  INDIA: {
    name: 'India',
    color: 'text-blue-500',
    bgColor: 'bg-blue-600',
    borderColor: 'border-blue-500',
    flag: '🇮🇳'
  },
  PAKISTAN: {
    name: 'Pakistan',
    color: 'text-green-500',
    bgColor: 'bg-green-600',
    borderColor: 'border-green-500',
    flag: '🇵🇰'
  }
};

export const COMMENTARY_MESSAGES = {
  OUT: [
    "Clean bowled! What a delivery!",
    "Caught! Straight into the hands of the fielder.",
    "LBW! That looked plump.",
    "Run out! A mix-up in the middle.",
    "Stumped! The batter was miles out.",
    "The bails go flying! He's gone!",
    "Edged and taken! The keeper makes no mistake."
  ],
  SIX: [
    "Maximum! That's gone out of the park!",
    "Huge hit! All the way for six!",
    "That's massive! Into the top tier!",
    "Launched into orbit! What a strike!",
    "Clean hit! That's sailing over the ropes."
  ],
  FOUR: [
    "Beautiful drive through the covers for four!",
    "Smashed to the boundary! Four runs.",
    "Elegant stroke play, finding the gap.",
    "Races away to the fence!",
    "Classy shot, just timed it perfectly."
  ],
  SINGLE: [
    "Quick single taken.",
    "Pushed to long-on for one.",
    "Smart cricket, rotating the strike.",
    "Tapped and run, good calling.",
    "Just a single off that one."
  ],
  DOT: [
    "Good defensive shot.",
    "Straight to the fielder.",
    "No run there.",
    "Well bowled, dot ball.",
    "Can't get that one away."
  ]
};

export const getRandomCommentary = (runs: number, isOut: boolean): string => {
  if (isOut) return COMMENTARY_MESSAGES.OUT[Math.floor(Math.random() * COMMENTARY_MESSAGES.OUT.length)];
  if (runs === 6) return COMMENTARY_MESSAGES.SIX[Math.floor(Math.random() * COMMENTARY_MESSAGES.SIX.length)];
  if (runs === 4) return COMMENTARY_MESSAGES.FOUR[Math.floor(Math.random() * COMMENTARY_MESSAGES.FOUR.length)];
  if (runs === 0) return COMMENTARY_MESSAGES.DOT[Math.floor(Math.random() * COMMENTARY_MESSAGES.DOT.length)];
  return COMMENTARY_MESSAGES.SINGLE[Math.floor(Math.random() * COMMENTARY_MESSAGES.SINGLE.length)];
};