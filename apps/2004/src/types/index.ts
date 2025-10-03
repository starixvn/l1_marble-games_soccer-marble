import { Timeline } from "@soccer-marble/soccer-marble-base";

export type GameTiming = {
  wholeRound: number;
  timelines: Array<Timeline>;
  extraInfo: {
    videoLength: number;
    oddsDuration: number;
    resultDuration: number;
    halfTimeDuration: number;
    afterGoalDuration: number;
  };
};

export type OddsInfo = {
  handicapValue: number;
  overUnderValue: number;
};
