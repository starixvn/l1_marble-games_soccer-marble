export const gameSettings: GameSettings = {
  upcomingEvents: 3,
  duration: {
    wholeRound: 120,
    timelines: [
      {
        oddsAvailable: 0,
        videoInfoAvailable: 35,
        resultAvailable: 65,
      },
      {
        oddsAvailable: 65,
        videoInfoAvailable: 80,
        resultAvailable: 110,
      },
    ],
  },
  teams: ["MCI", "RMA", "BAR", "LIV", "ARS", "FCB", "INT", "LEV", "AVL", "ATA", "BVB", "JUV", "PSG", "SCP", "ATM", "MIL"],
};

export type GameSettings = {
  upcomingEvents: number;
  duration: Duration;
  teams: string[];
};

export type Duration = {
  wholeRound: number;
  timelines: Array<Timeline>;
};

export type Timeline = {
  oddsAvailable: number;
  videoInfoAvailable: number;
  resultAvailable: number;
};

export enum Phase {
  OddsAvailable = "oddsAvailable",
  VideoInfoAvailable = "videoInfoAvailable",
  ResultAvailable = "resultAvailable",
}
