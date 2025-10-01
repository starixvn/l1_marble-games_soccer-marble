import { GameTiming as BaseGameTiming } from "@soccer-marble/soccer-marble-base";

export type GameTiming = BaseGameTiming & {
  extraInfo: {
    videoLength: number;
    oddsDuration: number;
    resultDuration: number;
    halfTimeDuration: number;
    breakDuration: number;
  };
};

export type OddsInfo = {
  handicapValue: number;
  overUnderValue: number;
};
