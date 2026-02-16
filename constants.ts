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
    "Edged and taken! The keeper makes no mistake.",
    "Caught behind! A faint edge.",
    "Hit wicket! Oh, that is unfortunate."
  ],
  RUNS_6: [
    "Maximum! That's gone out of the park!",
    "Huge hit! All the way for six!",
    "That's massive! Into the top tier!",
    "Launched into orbit! What a strike!",
    "Clean hit! That's sailing over the ropes.",
    "Six runs! The crowd goes wild!"
  ],
  RUNS_5: [
    "Five runs! That is extremely rare!",
    "Overthrows! Bonus runs for the batting side.",
    "Five wides? No, hard running for five!",
    "Incredible running between the wickets, five runs.",
    "A rare five runs added to the total."
  ],
  RUNS_4: [
    "Beautiful drive through the covers for four!",
    "Smashed to the boundary! Four runs.",
    "Elegant stroke play, finding the gap.",
    "Races away to the fence! Four runs.",
    "Classy shot, just timed it perfectly.",
    "One bounce and over the rope, four runs."
  ],
  RUNS_3: [
    "Great running, they come back for a third.",
    "Into the gap, easy three runs there.",
    "Pushing the fielder hard, excellent running.",
    "Three runs added to the score.",
    "Stopped just inside the boundary, three runs."
  ],
  RUNS_2: [
    "Working it into the gap for a couple.",
    "Two runs, good placement.",
    "Smart cricket, running the first one hard.",
    "Pushed to the deep, easy double.",
    "Good running, two runs added."
  ],
  RUNS_1: [
    "Quick single taken.",
    "Pushed to long-on for one.",
    "Smart cricket, rotating the strike.",
    "Tapped and run, good calling.",
    "Just a single off that one.",
    "Nudged around the corner for a single."
  ]
};

export const COACH_TIPS_FALLBACK = [
  "Rotate the strike to keep the scoreboard moving.",
  "Don't take unnecessary risks, play the ball on merit.",
  "Look for the gaps in the field.",
  "Keep your eye on the ball till the very end.",
  "A steady partnership is key right now.",
  "Accelerate if the bowler is under pressure.",
  "Defend the good balls, punish the bad ones.",
  "Stay calm and focus on the next delivery.",
  "Pressure creates wickets, keep it tight.",
  "Mix up your deliveries to confuse the batter."
];

export const getRandomCommentary = (runs: number, isOut: boolean): string => {
  if (isOut) return COMMENTARY_MESSAGES.OUT[Math.floor(Math.random() * COMMENTARY_MESSAGES.OUT.length)];
  
  switch (runs) {
    case 6: return COMMENTARY_MESSAGES.RUNS_6[Math.floor(Math.random() * COMMENTARY_MESSAGES.RUNS_6.length)];
    case 5: return COMMENTARY_MESSAGES.RUNS_5[Math.floor(Math.random() * COMMENTARY_MESSAGES.RUNS_5.length)];
    case 4: return COMMENTARY_MESSAGES.RUNS_4[Math.floor(Math.random() * COMMENTARY_MESSAGES.RUNS_4.length)];
    case 3: return COMMENTARY_MESSAGES.RUNS_3[Math.floor(Math.random() * COMMENTARY_MESSAGES.RUNS_3.length)];
    case 2: return COMMENTARY_MESSAGES.RUNS_2[Math.floor(Math.random() * COMMENTARY_MESSAGES.RUNS_2.length)];
    case 1: return COMMENTARY_MESSAGES.RUNS_1[Math.floor(Math.random() * COMMENTARY_MESSAGES.RUNS_1.length)];
    default: return "Good defensive shot, no run.";
  }
};