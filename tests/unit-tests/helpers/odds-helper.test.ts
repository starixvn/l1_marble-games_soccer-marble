import { calculateOddsForRound, parseScore, roundToPrecision } from '../../../src/helpers/odds-helper';

describe('parseScore', () => {
  it('should parse a simple score string into an array of numbers', () => {
    expect(parseScore('1-0')).toEqual([1, 0]);
    expect(parseScore('0-1')).toEqual([0, 1]);
    expect(parseScore('2-2')).toEqual([2, 2]);
  });

  it('should handle high-scoring matches', () => {
    expect(parseScore('5-3')).toEqual([5, 3]);
    expect(parseScore('7-0')).toEqual([7, 0]);
    expect(parseScore('0-8')).toEqual([0, 8]);
  });

  it('should handle single-digit scores', () => {
    expect(parseScore('0-0')).toEqual([0, 0]);
    expect(parseScore('1-1')).toEqual([1, 1]);
    expect(parseScore('9-9')).toEqual([9, 9]);
  });
});

describe('roundToPrecision', () => {
  it('should round to 2 decimal places with default precision', () => {
    expect(roundToPrecision(1.256)).toBe(1.25);
    expect(roundToPrecision(2.99)).toBe(2.99);
    expect(roundToPrecision(3.505)).toBe(3.50);
  });

  it('should round using custom precision values', () => {
    expect(roundToPrecision(1.256, 10)).toBe(1.2);
    expect(roundToPrecision(2.998, 1000)).toBe(2.998);
    expect(roundToPrecision(3.505, 1)).toBe(3);
  });

  it('should handle edge cases', () => {
    expect(roundToPrecision(0)).toBe(0);
    expect(roundToPrecision(-1.235)).toBe(-1.24);
    expect(roundToPrecision(1000000.125)).toBe(1000000.12);
  });
});


describe("calculateOddsForRound", () => {
  it("should calculate odds for round", () => {
    const matchConfig = {
      firstHalf: {
        scoreRate: {
          '2-1': 0.1294,
          '1-0': 0.1176,
          '2-0': 0.1176,
          '3-1': 0.0824,
          '3-0': 0.0706,
          '4-0': 0.0235,
          '1-1': 0.1293,
          '2-2': 0.0706,
          '0-1': 0.0824,
          '1-2': 0.0824,
          '0-2': 0.0353,
          '1-3': 0.0353,
          '0-3': 0.0118,
          '0-4': 0.0118
        }
      },
      secondHalf: {
        scoreRate: {
          '1-0': 0.1285,
          '0-1': 0.1285,
          '1-1': 0.18,
          '2-0': 0.0834,
          '0-2': 0.0834,
          '2-1': 0.0729,
          '1-2': 0.0729,
          '3-0': 0.0416,
          '0-3': 0.0416,
          '2-2': 0.0628,
          '3-1': 0.0418,
          '1-3': 0.0418,
          '4-0': 0.0104,
          '0-4': 0.0104
        }
      }
    };
    
    const firstHalfScore = "AHH";
    
    const expected = {
      odds: [
        {
          h1_hdp_home: 1.84,
          h1_hdp_away: 2.17,
          h1_1x2_home: 1.84,
          h1_1x2_away: 3.86,
          h1_1x2_draw: 5,
          h1_ou_over: 1.93,
          h1_ou_under: 2.07,
          h1_oe_odd: 2.02,
          h1_oe_even: 1.97,
          
          ft_hdp_home: 1.93,
          ft_hdp_away: 2.07,
          ft_1x2_home: 1.93,
          ft_1x2_away: 3.18,
          ft_1x2_draw: 5.91,
          ft_ou_over: 3.03,
          ft_ou_under: 2.42,
          ft_oe_odd: 2,
          ft_oe_even: 1.99
        },
        {
          ft_hdp_home: 2.64,
          ft_hdp_away: 2.64,
          ft_ou_over: 2.52,
          ft_ou_under: 1.65,
          ft_oe_odd: 1.94,
          ft_oe_even: 2.05
        }
      ],
      selections: [
        {
          h1_hdp_home: {
            name: "h1_hdp_home",
            price: 1.84,
            point: -0.5,
            settlementStatus: "P"
          },
          h1_hdp_away: {
            name: "h1_hdp_away",
            price: 2.17,
            point: 0.5,
            settlementStatus: "P"
          },
          h1_1x2_home: {
            name: "h1_1x2_home",
            price: 1.84,
            point: 0,
            settlementStatus: "P"
          },
          h1_1x2_away: {
            name: "h1_1x2_away",
            price: 3.86,
            point: 0,
            settlementStatus: "P"
          },
          h1_1x2_draw: {
            name: "h1_1x2_draw",
            price: 5,
            point: 0,
            settlementStatus: "P"
          },
          h1_ou_over: {
            name: "h1_ou_over",
            price: 1.93,
            point: 2.5,
            settlementStatus: "P"
          },
          h1_ou_under: {
            name: "h1_ou_under",
            price: 2.07,
            point: 2.5,
            settlementStatus: "P"
          },
          h1_oe_odd: {
            name: "h1_oe_odd",
            price: 2.02,
            point: 0,
            settlementStatus: "P"
          },
          h1_oe_even: {
            name: "h1_oe_even",
            price: 1.97,
            point: 0,
            settlementStatus: "P"
          },
          ft_hdp_home: {
            name: "ft_hdp_home",
            price: 1.93,
            point: -0.5,
            settlementStatus: "P"
          },
          ft_hdp_away: {
            name: "ft_hdp_away",
            price: 2.07,
            point: 0.5,
            settlementStatus: "P"
          },
          ft_1x2_home: {
            name: "ft_1x2_home",
            price: 1.93,
            point: 0,
            settlementStatus: "P"
          },
          ft_1x2_away: {
            name: "ft_1x2_away",
            price: 3.18,
            point: 0,
            settlementStatus: "P"
          },
          ft_1x2_draw: {
            name: "ft_1x2_draw",
            price: 5.91,
            point: 0,
            settlementStatus: "P"
          },
          ft_ou_over: {
            name: "ft_ou_over",
            price: 3.03,
            point: 5,
            settlementStatus: "P"
          },
          ft_ou_under: {
            name: "ft_ou_under",
            price: 2.42,
            point: 5,
            settlementStatus: "P"
          },
          ft_oe_odd: {
            name: "ft_oe_odd",
            price: 2,
            point: 0,
            settlementStatus: "P"
          },
          ft_oe_even: {
            name: "ft_oe_even",
            price: 1.99,
            point: 0,
            settlementStatus: "P"
          }
        },
        {
          ft_hdp_home: {
            name: "ft_hdp_home",
            price: 2.64,
            point: -1, 
            settlementStatus: "P"
          },
          ft_hdp_away: {
            name: "ft_hdp_away",
            price: 2.64,
            point: 1, 
            settlementStatus: "P"
          },
          ft_ou_over: {
            name: "ft_ou_over",
            price: 2.52,
            point: 5.5, 
            settlementStatus: "P"
          },
          ft_ou_under: {
            name: "ft_ou_under",
            price: 1.65,
            point: 5.5, 
            settlementStatus: "P"
          },
          ft_oe_odd: {
            name: "ft_oe_odd",
            price: 1.94,
            point: 0,
            settlementStatus: "P"
          },
          ft_oe_even: {
            name: "ft_oe_even",
            price: 2.05,
            point: 0,
            settlementStatus: "P"
          }
        }
      ],
      matchConfig: {
        firstHalf: {
          scoreRate: matchConfig.firstHalf.scoreRate,
          overUnderValue: 2.5,
          handicapValue: -0.5
        },
        secondHalf: {
          scoreRate: matchConfig.secondHalf.scoreRate,
          overUnderValue: 2.5,
          handicapValue: 0
        },
        overUnderValue: 5,
        handicapValue: -0.5
      }
    };
    
    const actual = calculateOddsForRound(matchConfig, firstHalfScore);
    
    expect(actual).toEqual(expected);
  });
});