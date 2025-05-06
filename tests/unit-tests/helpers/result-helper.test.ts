import { generateResult, generateVideoName, getScoreFromScoreRate, getSettlementResult } from "../../../src/helpers/result-helper";
import crypto from "crypto";
import { SettlementStatus } from "../../../src/types";

const NUMBER_OF_VIDEOS = {
    HAA: 1,
    AHH: 2,
    A: 1,
    H: 1,
}

describe("getScoreFromScoreRate", () => {
    it("should return one of the valid scores", () => {
        // Arrange
        const scoreRate = {
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

        // Act
        const result = getScoreFromScoreRate(scoreRate);

        // Assert
        expect(Object.keys(scoreRate)).toContain(result);
    });
});

describe("generateVideoName", () => {
    it("should return a valid video name", () => {
        // Arrange
        const result = "HAA";

        const videoName = generateVideoName(result, NUMBER_OF_VIDEOS);
        const expectedVideoname = crypto.createHash("sha256").update(`${result}-0`).digest("hex");

        // Assert
        expect(videoName).toBe(expectedVideoname);
    });
});

describe("generateResult", () => {
    it("should return a valid result based on match config", () => {
        // Arrange
        const matchConfig = {
            firstHalf: {
                scoreRate: {
                    "1-0": 1,
                },
            },
            secondHalf: {
                scoreRate: {
                    "0-1": 1,
                },
            },
        };

        const firstHalfVideo = crypto.createHash("sha256").update(`H-0`).digest("hex");
        const secondHalfVideo = crypto.createHash("sha256").update(`A-0`).digest("hex");

        const expectedFirstHalfResult = {
            playlist: firstHalfVideo,
            goalInfo: firstHalfVideo,
            result: { goalSequence: 'H', finalScore: '1:0' }
        }

        const expectedSecondHalfResult = {
            playlist: secondHalfVideo,
            goalInfo: secondHalfVideo,
            result: { goalSequence: 'A', finalScore: '0:1' }
          }

        // Act
        const result = generateResult({
            numberOfVideos: NUMBER_OF_VIDEOS,
            matchConfig
        });

        // Assert
        const [firstHalf, secondHalf] = result.drawResults;

        expect(firstHalf).toEqual(expectedFirstHalfResult);
        expect(secondHalf).toEqual(expectedSecondHalfResult);
    });
});

describe("getSettlementResult", () => {
    describe("first half", () => {
        describe("handicap home win", () => {
            it("h1_hdp_home should be W", () => {
                // Arrange
                const roundResult = {
                    drawResults: [
                        { 
                            playlist: "test-video-1",
                            goalInfo: "test-video-1",
                            result: { goalSequence: 'HH', finalScore: '2:0' } 
                        },
                        { 
                            playlist: "test-video-2",
                            goalInfo: "test-video-2",
                            result: { goalSequence: 'A', finalScore: '0:1' } 
                        }
                    ]
                };
                const matchConfig = {
                    firstHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: -0.5,
                        scoreRate: { "1-0": 1 }
                    },
                    secondHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "0-1": 1 }
                    },
                    overUnderValue: 2.5,
                    handicapValue: -0.5
                };

                // Act
                const result = getSettlementResult(roundResult, matchConfig);

                // Assert
                expect(result[0].h1_hdp_home).toBe(SettlementStatus.WIN);
            });

            it("h1_hdp_away should be L", () => {
                // Arrange
                const roundResult = {
                    drawResults: [
                        { 
                            playlist: "test-video-1",
                            goalInfo: "test-video-1",
                            result: { goalSequence: 'HH', finalScore: '2:0' } 
                        },
                        { 
                            playlist: "test-video-2",
                            goalInfo: "test-video-2",
                            result: { goalSequence: 'A', finalScore: '0:1' } 
                        }
                    ]
                };
                const matchConfig = {
                    firstHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: -0.5,
                        scoreRate: { "1-0": 1 }
                    },
                    secondHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "0-1": 1 }
                    },
                    overUnderValue: 2.5,
                    handicapValue: -0.5
                };

                // Act
                const result = getSettlementResult(roundResult, matchConfig);

                // Assert
                expect(result[0].h1_hdp_away).toBe(SettlementStatus.LOSE);
            });
        });

        describe("handicap away win", () => {
            it("h1_hdp_home should be L", () => {
                // Arrange
                const roundResult = {
                    drawResults: [
                        { 
                            playlist: "test-video-2",
                            goalInfo: "test-video-2",
                            result: { goalSequence: 'A', finalScore: '0:1' } 
                        },
                        { 
                            playlist: "test-video-1",
                            goalInfo: "test-video-1",
                            result: { goalSequence: 'H', finalScore: '1:0' } 
                        }
                    ]
                };
                const matchConfig = {
                    firstHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: -0.5,
                        scoreRate: { "0-1": 1 }
                    },
                    secondHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "1-0": 1 }
                    },
                    overUnderValue: 2.5,
                    handicapValue: -0.5
                };

                // Act
                const result = getSettlementResult(roundResult, matchConfig);

                // Assert
                expect(result[0].h1_hdp_home).toBe(SettlementStatus.LOSE);
            });

            it("h1_hdp_away should be W", () => {
                // Arrange
                const roundResult = {
                    drawResults: [
                        { 
                            playlist: "test-video-2",
                            goalInfo: "test-video-2",
                            result: { goalSequence: 'A', finalScore: '0:1' } 
                        },
                        { 
                            playlist: "test-video-1",
                            goalInfo: "test-video-1",
                            result: { goalSequence: 'H', finalScore: '1:0' } 
                        }
                    ]
                };
                const matchConfig = {
                    firstHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: -0.5,
                        scoreRate: { "0-1": 1 }
                    },
                    secondHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "1-0": 1 }
                    },
                    overUnderValue: 2.5,
                    handicapValue: -0.5
                };

                // Act
                const result = getSettlementResult(roundResult, matchConfig);

                // Assert
                expect(result[0].h1_hdp_away).toBe(SettlementStatus.WIN);
            });
        });

        describe("handicap draw", () => {
            it("h1_hdp_home should be D", () => {
                // Arrange
                const roundResult = {
                    drawResults: [
                        { 
                            playlist: "test-video-1",
                            goalInfo: "test-video-1",
                            result: { goalSequence: 'A', finalScore: '0:1' } 
                        },
                        { 
                            playlist: "test-video-2",
                            goalInfo: "test-video-2",
                            result: { goalSequence: 'A', finalScore: '0:1' } 
                        }
                    ]
                };
                const matchConfig = {
                    firstHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 1,
                        scoreRate: { "1-0": 1 }
                    },
                    secondHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "0-1": 1 }
                    },
                    overUnderValue: 2.5,
                    handicapValue: -0.5
                };

                // Act
                const result = getSettlementResult(roundResult, matchConfig);

                // Assert
                expect(result[0].h1_hdp_home).toBe(SettlementStatus.DRAW);
            });

            it("h1_hdp_away should be D", () => {
                // Arrange
                const roundResult = {
                    drawResults: [
                        { 
                            playlist: "test-video-1",
                            goalInfo: "test-video-1",
                            result: { goalSequence: 'A', finalScore: '0-1' } 
                        },
                        { 
                            playlist: "test-video-2",
                            goalInfo: "test-video-2",
                            result: { goalSequence: 'A', finalScore: '0:1' } 
                        }
                    ]
                };
                const matchConfig = {
                    firstHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 1,
                        scoreRate: { "1-0": 1 }
                    },
                    secondHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "0-1": 1 }
                    },
                    overUnderValue: 2.5,
                    handicapValue: -0.5
                };

                // Act
                const result = getSettlementResult(roundResult, matchConfig);

                // Assert
                expect(result[0].h1_hdp_away).toBe(SettlementStatus.DRAW);
            });
        });

        describe("1x2 home win", () => {
            it("h1_1x2_home should be W", () => {
                // Arrange
                const roundResult = {
                    drawResults: [
                        { 
                            playlist: "test-video-1",
                            goalInfo: "test-video-1",
                            result: { goalSequence: 'H', finalScore: '1:0' } 
                        },
                        { 
                            playlist: "test-video-2",
                            goalInfo: "test-video-2",
                            result: { goalSequence: 'A', finalScore: '0:1' } 
                        }
                    ]
                };
                const matchConfig = {
                    firstHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "1-0": 1 }
                    },
                    secondHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "0-1": 1 }
                    },
                    overUnderValue: 2.5,
                    handicapValue: 0
                };

                // Act
                const result = getSettlementResult(roundResult, matchConfig);

                // Assert
                expect(result[0].h1_1x2_home).toBe(SettlementStatus.WIN);
            });
            it("h1_1x2_away should be L", () => {
                // Arrange
                const roundResult = {
                    drawResults: [
                        { 
                            playlist: "test-video-1",
                            goalInfo: "test-video-1",
                            result: { goalSequence: 'H', finalScore: '1:0' } 
                        },
                        { 
                            playlist: "test-video-2",
                            goalInfo: "test-video-2",
                            result: { goalSequence: 'A', finalScore: '0:1' } 
                        }
                    ]
                };
                const matchConfig = {
                    firstHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "1-0": 1 }
                    },
                    secondHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "0-1": 1 }
                    },
                    overUnderValue: 2.5,
                    handicapValue: 0
                };

                // Act
                const result = getSettlementResult(roundResult, matchConfig);

                // Assert
                expect(result[0].h1_1x2_away).toBe(SettlementStatus.LOSE);
            });

            it("h1_1x2_draw should be L", () => {
                // Arrange
                const roundResult = {
                    drawResults: [
                        { 
                            playlist: "test-video-1",
                            goalInfo: "test-video-1",
                            result: { goalSequence: 'H', finalScore: '1:0' } 
                        },
                        { 
                            playlist: "test-video-2",
                            goalInfo: "test-video-2",
                            result: { goalSequence: 'A', finalScore: '0:1' } 
                        }
                    ]
                };
                const matchConfig = {
                    firstHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "1-0": 1 }
                    },
                    secondHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "0-1": 1 }
                    },
                    overUnderValue: 2.5,
                    handicapValue: 0
                };

                // Act
                const result = getSettlementResult(roundResult, matchConfig);

                // Assert
                expect(result[0].h1_1x2_draw).toBe(SettlementStatus.LOSE);
            });
        });

        describe("1x2 away win", () => {
            it("h1_1x2_home should be L", () => {
                // Arrange
                const roundResult = {
                    drawResults: [
                        { 
                            playlist: "test-video-2",
                            goalInfo: "test-video-2",
                            result: { goalSequence: 'A', finalScore: '0:1' } 
                        },
                        { 
                            playlist: "test-video-1",
                            goalInfo: "test-video-1",
                            result: { goalSequence: 'H', finalScore: '1:0' } 
                        }
                    ]
                };
                const matchConfig = {
                    firstHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "0-1": 1 }
                    },
                    secondHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "1-0": 1 }
                    },
                    overUnderValue: 2.5,
                    handicapValue: 0
                };

                // Act
                const result = getSettlementResult(roundResult, matchConfig);

                // Assert
                expect(result[0].h1_1x2_home).toBe(SettlementStatus.LOSE);
            });
            it("h1_1x2_away should be W", () => {
                // Arrange
                const roundResult = {
                    drawResults: [
                        { 
                            playlist: "test-video-2",
                            goalInfo: "test-video-2",
                            result: { goalSequence: 'A', finalScore: '0:1' } 
                        },
                        { 
                            playlist: "test-video-1",
                            goalInfo: "test-video-1",
                            result: { goalSequence: 'H', finalScore: '1:0' } 
                        }
                    ]
                };
                const matchConfig = {
                    firstHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "0-1": 1 }
                    },
                    secondHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "1-0": 1 }
                    },
                    overUnderValue: 2.5,
                    handicapValue: 0
                };

                // Act
                const result = getSettlementResult(roundResult, matchConfig);

                // Assert
                expect(result[0].h1_1x2_away).toBe(SettlementStatus.WIN);
            });

            it("h1_1x2_draw should be L", () => {
                // Arrange
                const roundResult = {
                    drawResults: [
                        { 
                            playlist: "test-video-2",
                            goalInfo: "test-video-2",
                            result: { goalSequence: 'A', finalScore: '0:1' } 
                        },
                        { 
                            playlist: "test-video-1",
                            goalInfo: "test-video-1",
                            result: { goalSequence: 'H', finalScore: '1:0' } 
                        }
                    ]
                };
                const matchConfig = {
                    firstHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "0-1": 1 }
                    },
                    secondHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "1-0": 1 }
                    },
                    overUnderValue: 2.5,
                    handicapValue: 0
                };

                // Act
                const result = getSettlementResult(roundResult, matchConfig);

                // Assert
                expect(result[0].h1_1x2_draw).toBe(SettlementStatus.LOSE);
            });
        });

        describe("1x2 draw", () => {
            it("h1_1x2_home should be L", () => {
                // Arrange
                const roundResult = {
                    drawResults: [
                        { 
                            playlist: "test-video-1",
                            goalInfo: "test-video-1",
                            result: { goalSequence: 'HA', finalScore: '1:1' } 
                        },
                        { 
                            playlist: "test-video-2",
                            goalInfo: "test-video-2",
                            result: { goalSequence: 'H', finalScore: '1:0' } 
                        }
                    ]
                };
                const matchConfig = {
                    firstHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "1-0": 1 }
                    },
                    secondHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "0-1": 1 }
                    },
                    overUnderValue: 2.5,
                    handicapValue: 0
                };

                // Act
                const result = getSettlementResult(roundResult, matchConfig);

                // Assert
                expect(result[0].h1_1x2_home).toBe(SettlementStatus.LOSE);
            });
            it("h1_1x2_away should be L", () => {
                // Arrange
                const roundResult = {
                    drawResults: [
                        { 
                            playlist: "test-video-1",
                            goalInfo: "test-video-1",
                            result: { goalSequence: 'HA', finalScore: '1:1' } 
                        },
                        { 
                            playlist: "test-video-2",
                            goalInfo: "test-video-2",
                            result: { goalSequence: 'H', finalScore: '1:0' } 
                        }
                    ]
                };
                const matchConfig = {
                    firstHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "1-0": 1 }
                    },
                    secondHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "0-1": 1 }
                    },
                    overUnderValue: 2.5,
                    handicapValue: 0
                };

                // Act
                const result = getSettlementResult(roundResult, matchConfig);

                // Assert
                expect(result[0].h1_1x2_away).toBe(SettlementStatus.LOSE);
            });

            it("h1_1x2_draw should be W", () => {
                // Arrange
                const roundResult = {
                    drawResults: [
                        { 
                            playlist: "test-video-1",
                            goalInfo: "test-video-1",
                            result: { goalSequence: 'HA', finalScore: '1:1' } 
                        },
                        { 
                            playlist: "test-video-2",
                            goalInfo: "test-video-2",
                            result: { goalSequence: 'H', finalScore: '1:0' } 
                        }
                    ]
                };
                const matchConfig = {
                    firstHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "1-0": 1 }
                    },
                    secondHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "0-1": 1 }
                    },
                    overUnderValue: 2.5,
                    handicapValue: 0
                };

                // Act
                const result = getSettlementResult(roundResult, matchConfig);

                // Assert
                expect(result[0].h1_1x2_draw).toBe(SettlementStatus.WIN);
            });
        });

        describe("over", () => {
            it("h1_ou_over should be W", () => {
                // Arrange
                const roundResult = {
                    drawResults: [
                        { 
                            playlist: "test-video-1",
                            goalInfo: "test-video-1",
                            result: { goalSequence: 'HHA', finalScore: '2:1' } 
                        },
                        { 
                            playlist: "test-video-2",
                            goalInfo: "test-video-2",
                            result: { goalSequence: 'H', finalScore: '1:0' } 
                        }
                    ]
                };
                const matchConfig = {
                    firstHalf: { 
                        overUnderValue: 2.5, 
                        handicapValue: 0,
                        scoreRate: { "1-0": 1 }
                    },
                    secondHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "0-1": 1 }
                    },
                    overUnderValue: 3.5,
                    handicapValue: 0
                };

                // Act
                const result = getSettlementResult(roundResult, matchConfig);

                // Assert
                expect(result[0].h1_ou_over).toBe(SettlementStatus.WIN);
            });

            it("h1_ou_under should be L", () => {
                // Arrange
                const roundResult = {
                    drawResults: [
                        { 
                            playlist: "test-video-1",
                            goalInfo: "test-video-1",
                            result: { goalSequence: 'HHA', finalScore: '2:1' } 
                        },
                        { 
                            playlist: "test-video-2",
                            goalInfo: "test-video-2",
                            result: { goalSequence: 'H', finalScore: '1:0' } 
                        }
                    ]
                };
                const matchConfig = {
                    firstHalf: { 
                        overUnderValue: 2.5, 
                        handicapValue: 0,
                        scoreRate: { "1-0": 1 }
                    },
                    secondHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "0-1": 1 }
                    },
                    overUnderValue: 3.5,
                    handicapValue: 0
                };

                // Act
                const result = getSettlementResult(roundResult, matchConfig);

                // Assert
                expect(result[0].h1_ou_under).toBe(SettlementStatus.LOSE);
            });
        });

        describe("under", () => {
            it("h1_ou_over should be L", () => {
                // Arrange
                const roundResult = {
                    drawResults: [
                        { 
                            playlist: "test-video-2",
                            goalInfo: "test-video-2",
                            result: { goalSequence: 'H', finalScore: '1:0' } 
                        },
                        { 
                            playlist: "test-video-1",
                            goalInfo: "test-video-1",
                            result: { goalSequence: 'A', finalScore: '0:1' } 
                        }
                    ]
                };
                const matchConfig = {
                    firstHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "0-1": 1 }
                    },
                    secondHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "1-0": 1 }
                    },
                    overUnderValue: 2.5,
                    handicapValue: 0
                };

                // Act
                const result = getSettlementResult(roundResult, matchConfig);

                // Assert
                expect(result[0].h1_ou_over).toBe(SettlementStatus.LOSE);
            });

            it("h1_ou_under should be W", () => {
                // Arrange
                const roundResult = {
                    drawResults: [
                        { 
                            playlist: "test-video-2",
                            goalInfo: "test-video-2",
                            result: { goalSequence: 'H', finalScore: '1:0' } 
                        },
                        { 
                            playlist: "test-video-1",
                            goalInfo: "test-video-1",
                            result: { goalSequence: 'A', finalScore: '0:1' } 
                        }
                    ]
                };
                const matchConfig = {
                    firstHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "0-1": 1 }
                    },
                    secondHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "1-0": 1 }
                    },
                    overUnderValue: 2.5,
                    handicapValue: 0
                };

                // Act
                const result = getSettlementResult(roundResult, matchConfig);

                // Assert
                expect(result[0].h1_ou_under).toBe(SettlementStatus.WIN);
            });
        });

        describe("odd", () => {
            it("h1_oe_odd should be W", () => {
                // Arrange
                const roundResult = {
                    drawResults: [
                        { 
                            playlist: "test-video-2",
                            goalInfo: "test-video-2",
                            result: { goalSequence: 'H', finalScore: '1:0' } 
                        },
                        { 
                            playlist: "test-video-1",
                            goalInfo: "test-video-1",
                            result: { goalSequence: 'A', finalScore: '0:1' } 
                        }
                    ]
                };
                const matchConfig = {
                    firstHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "0-1": 1 }
                    },
                    secondHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "1-0": 1 }
                    },
                    overUnderValue: 2.5,
                    handicapValue: 0
                };

                // Act
                const result = getSettlementResult(roundResult, matchConfig);

                // Assert
                expect(result[0].h1_oe_odd).toBe(SettlementStatus.WIN);
            });

            it("h1_oe_even should be L", () => {
                // Arrange
                const roundResult = {
                    drawResults: [
                        { 
                            playlist: "test-video-2",
                            goalInfo: "test-video-2",
                            result: { goalSequence: 'H', finalScore: '1:0' } 
                        },
                        { 
                            playlist: "test-video-1",
                            goalInfo: "test-video-1",
                            result: { goalSequence: 'A', finalScore: '0:1' } 
                        }
                    ]
                };
                const matchConfig = {
                    firstHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "0-1": 1 }
                    },
                    secondHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "1-0": 1 }
                    },
                    overUnderValue: 2.5,
                    handicapValue: 0
                };

                // Act
                const result = getSettlementResult(roundResult, matchConfig);

                // Assert
                expect(result[0].h1_oe_even).toBe(SettlementStatus.LOSE);
            });
        });

        describe("even", () => {
            it("h1_oe_odd should be L", () => {
                // Arrange
                const roundResult = {
                    drawResults: [
                        { 
                            playlist: "test-video-1",
                            goalInfo: "test-video-1",
                            result: { goalSequence: 'HH', finalScore: '2:0' } 
                        },
                        { 
                            playlist: "test-video-2",
                            goalInfo: "test-video-2",
                            result: { goalSequence: 'A', finalScore: '0:1' } 
                        }
                    ]
                };
                const matchConfig = {
                    firstHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "0-1": 1 }
                    },
                    secondHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "1-0": 1 }
                    },
                    overUnderValue: 2.5,
                    handicapValue: 0
                };

                // Act
                const result = getSettlementResult(roundResult, matchConfig);

                // Assert
                expect(result[0].h1_oe_odd).toBe(SettlementStatus.LOSE);
            });

            it("h1_oe_even should be W", () => {
                // Arrange
                const roundResult = {
                    drawResults: [
                        { 
                            playlist: "test-video-1",
                            goalInfo: "test-video-1",
                            result: { goalSequence: 'HH', finalScore: '2:0' } 
                        },
                        { 
                            playlist: "test-video-2",
                            goalInfo: "test-video-2",
                            result: { goalSequence: 'A', finalScore: '0:1' } 
                        }
                    ]
                };
                const matchConfig = {
                    firstHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "0-1": 1 }
                    },
                    secondHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "1-0": 1 }
                    },
                    overUnderValue: 2.5,
                    handicapValue: 0
                };

                // Act
                const result = getSettlementResult(roundResult, matchConfig);

                // Assert
                expect(result[0].h1_oe_even).toBe(SettlementStatus.WIN);
            });
        });
    });

    describe("full time", () => {
        describe("handicap home win", () => {
            it("ft_hdp_home should be W", () => {
                // Arrange
                const roundResult = {
                    drawResults: [
                        { 
                            playlist: "test-video-1",
                            goalInfo: "test-video-1",
                            result: { goalSequence: 'HH', finalScore: '2:0' } 
                        },
                        { 
                            playlist: "test-video-2",
                            goalInfo: "test-video-2",
                            result: { goalSequence: 'A', finalScore: '0:1' } 
                        }
                    ]
                };
                const matchConfig = {
                    firstHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "1-0": 1 }
                    },
                    secondHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "0-1": 1 }
                    },
                    overUnderValue: 2.5,
                    handicapValue: -0.5
                };

                // Act
                const result = getSettlementResult(roundResult, matchConfig);

                // Assert
                expect(result[0].ft_hdp_home).toBe(SettlementStatus.WIN);
            });
            
            it("ft_hdp_away should be L", () => {
                // Arrange
                const roundResult = {
                    drawResults: [
                        { 
                            playlist: "test-video-1",
                            goalInfo: "test-video-1",
                            result: { goalSequence: 'HH', finalScore: '2:0' } 
                        },
                        { 
                            playlist: "test-video-2",
                            goalInfo: "test-video-2",
                            result: { goalSequence: 'A', finalScore: '0:1' } 
                        }
                    ]
                };
                const matchConfig = {
                    firstHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "1-0": 1 }
                    },
                    secondHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "0-1": 1 }
                    },
                    overUnderValue: 2.5,
                    handicapValue: -0.5
                };

                // Act
                const result = getSettlementResult(roundResult, matchConfig);

                // Assert
                expect(result[0].ft_hdp_away).toBe(SettlementStatus.LOSE);
            });
        });

        describe("handicap away win", () => {   
            it("ft_hdp_home should be L", () => {
                // Arrange
                const roundResult = {
                    drawResults: [
                        { 
                            playlist: "test-video-2",
                            goalInfo: "test-video-2",
                            result: { goalSequence: 'H', finalScore: '1:0' } 
                        },
                        { 
                            playlist: "test-video-1",
                            goalInfo: "test-video-1",
                            result: { goalSequence: 'AA', finalScore: '0:2' } 
                        }
                    ]
                };
                const matchConfig = {
                    firstHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "0-1": 1 }
                    },
                    secondHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "1-0": 1 }
                    },
                    overUnderValue: 2.5,
                    handicapValue: -1.5
                };

                // Act
                const result = getSettlementResult(roundResult, matchConfig);

                // Assert
                expect(result[0].ft_hdp_home).toBe(SettlementStatus.LOSE);
            });

            it("ft_hdp_away should be W", () => {
                // Arrange
                const roundResult = {
                    drawResults: [
                        { 
                            playlist: "test-video-2",
                            goalInfo: "test-video-2",
                            result: { goalSequence: 'H', finalScore: '1:0' } 
                        },
                        { 
                            playlist: "test-video-1",
                            goalInfo: "test-video-1",
                            result: { goalSequence: 'AA', finalScore: '0:2' } 
                        }
                    ]
                };
                const matchConfig = {
                    firstHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "0-1": 1 }
                    },
                    secondHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "1-0": 1 }
                    },
                    overUnderValue: 2.5,
                    handicapValue: -1.5
                };

                // Act
                const result = getSettlementResult(roundResult, matchConfig);

                // Assert
                expect(result[0].ft_hdp_away).toBe(SettlementStatus.WIN);
            });
        });

        describe("handicap draw", () => {
            it("ft_hdp_home should be D", () => {
                // Arrange
                const roundResult = {
                    drawResults: [
                        { 
                            playlist: "test-video-2",
                            goalInfo: "test-video-2",
                            result: { goalSequence: 'H', finalScore: '1:0' } 
                        },
                        { 
                            playlist: "test-video-1",
                            goalInfo: "test-video-1",
                            result: { goalSequence: 'A', finalScore: '0:1' } 
                        }
                    ]
                };
                const matchConfig = {
                    firstHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "0-1": 1 }
                    },
                    secondHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "1-0": 1 }
                    },
                    overUnderValue: 2.5,
                    handicapValue: 0
                };

                // Act
                const result = getSettlementResult(roundResult, matchConfig);

                // Assert
                expect(result[0].ft_hdp_home).toBe(SettlementStatus.DRAW);
            });

            it("ft_hdp_away should be D", () => {
                // Arrange
                const roundResult = {
                    drawResults: [
                        { 
                            playlist: "test-video-2",
                            goalInfo: "test-video-2",
                            result: { goalSequence: 'H', finalScore: '1:0' } 
                        },
                        { 
                            playlist: "test-video-1",
                            goalInfo: "test-video-1",
                            result: { goalSequence: 'A', finalScore: '0:1' } 
                        }
                    ]
                };
                const matchConfig = {
                    firstHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "0-1": 1 }
                    },
                    secondHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "1-0": 1 }
                    },
                    overUnderValue: 2.5,
                    handicapValue: 0
                };

                // Act
                const result = getSettlementResult(roundResult, matchConfig);

                // Assert
                expect(result[0].ft_hdp_away).toBe(SettlementStatus.DRAW);
            });
        });

        describe("over ", () => {
            it("ft_ou_over should be W", () => {
                // Arrange
                const roundResult = {
                    drawResults: [
                        { 
                            playlist: "test-video-1",
                            goalInfo: "test-video-1",
                            result: { goalSequence: 'HH', finalScore: '2:0' } 
                        },
                        { 
                            playlist: "test-video-2",
                            goalInfo: "test-video-2",
                            result: { goalSequence: 'AA', finalScore: '0:2' } 
                        }
                    ]
                };
                const matchConfig = {
                    firstHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "1-0": 1 }
                    },
                    secondHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "0-1": 1 }
                    },
                    overUnderValue: 3.5,
                    handicapValue: 0
                };

                // Act
                const result = getSettlementResult(roundResult, matchConfig);

                // Assert
                expect(result[0].ft_ou_over).toBe(SettlementStatus.WIN);
            });

            it("ft_ou_under should be L", () => {
                // Arrange
                const roundResult = {
                    drawResults: [
                        { 
                            playlist: "test-video-1",
                            goalInfo: "test-video-1",
                            result: { goalSequence: 'HH', finalScore: '2:0' } 
                        },
                        { 
                            playlist: "test-video-2",
                            goalInfo: "test-video-2",
                            result: { goalSequence: 'AA', finalScore: '0:2' } 
                        }
                    ]
                };
                const matchConfig = {
                    firstHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "1-0": 1 }
                    },
                    secondHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "0-1": 1 }
                    },
                    overUnderValue: 3.5,
                    handicapValue: 0
                };

                // Act
                const result = getSettlementResult(roundResult, matchConfig);

                // Assert
                expect(result[0].ft_ou_under).toBe(SettlementStatus.LOSE);
            });
        });

        describe("under", () => {
            it("ft_ou_over should be L", () => {
                // Arrange
                const roundResult = {
                    drawResults: [
                        { 
                            playlist: "test-video-2",
                            goalInfo: "test-video-2",
                            result: { goalSequence: 'H', finalScore: '1:0' } 
                        },
                        { 
                            playlist: "test-video-1",
                            goalInfo: "test-video-1",
                            result: { goalSequence: 'A', finalScore: '0:1' } 
                        }
                    ]
                };
                const matchConfig = {
                    firstHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "0-1": 1 }
                    },
                    secondHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "1-0": 1 }
                    },
                    overUnderValue: 2.5,
                    handicapValue: 0
                };

                // Act
                const result = getSettlementResult(roundResult, matchConfig);

                // Assert
                expect(result[0].ft_ou_over).toBe(SettlementStatus.LOSE);
            });

            it("ft_ou_under should be W", () => {
                // Arrange
                const roundResult = {
                    drawResults: [
                        { 
                            playlist: "test-video-2",
                            goalInfo: "test-video-2",
                            result: { goalSequence: 'H', finalScore: '1:0' } 
                        },
                        { 
                            playlist: "test-video-1",
                            goalInfo: "test-video-1",
                            result: { goalSequence: 'A', finalScore: '0:1' } 
                        }
                    ]
                };
                const matchConfig = {
                    firstHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "0-1": 1 }
                    },
                    secondHalf: { 
                        overUnderValue: 1.5, 
                        handicapValue: 0,
                        scoreRate: { "1-0": 1 }
                    },
                    overUnderValue: 2.5,
                    handicapValue: 0
                };

                // Act
                const result = getSettlementResult(roundResult, matchConfig);

                // Assert
                expect(result[0].ft_ou_under).toBe(SettlementStatus.WIN);
            });
        });

        describe("odd", () => {
            describe("first half odd", () => {
                it("ft_oe_odd should be L", () => {
                    // Arrange
                    const roundResult = {
                        drawResults: [
                            { 
                                playlist: "test-video-2",
                                goalInfo: "test-video-2",
                                result: { goalSequence: 'HA', finalScore: '1:0' } 
                            },
                            { 
                                playlist: "test-video-1",
                                goalInfo: "test-video-1",
                                result: { goalSequence: 'AH', finalScore: '0:1' } 
                            }
                        ]
                    };
                    const matchConfig = {
                        firstHalf: { 
                            overUnderValue: 1.5, 
                            handicapValue: 0,
                            scoreRate: { "0-1": 1 }
                        },
                        secondHalf: { 
                            overUnderValue: 1.5, 
                            handicapValue: 0,
                            scoreRate: { "1-0": 1 }
                        },
                        overUnderValue: 2.5,
                        handicapValue: 0
                    };

                    // Act
                    const result = getSettlementResult(roundResult, matchConfig);

                    // Assert
                    expect(result[1].ft_oe_odd).toBe(SettlementStatus.LOSE);
                });

                it("ft_oe_even should be W", () => {
                    // Arrange
                    const roundResult = {
                        drawResults: [
                            { 
                                playlist: "test-video-2",
                                goalInfo: "test-video-2",
                                result: { goalSequence: 'HA', finalScore: '1:0' } 
                            },
                            { 
                                playlist: "test-video-1",
                                goalInfo: "test-video-1",
                                result: { goalSequence: 'AH', finalScore: '0:1' } 
                            }
                        ]
                    };
                    const matchConfig = {
                        firstHalf: { 
                            overUnderValue: 1.5, 
                            handicapValue: 0,
                            scoreRate: { "0-1": 1 }
                        },
                        secondHalf: { 
                            overUnderValue: 1.5, 
                            handicapValue: 0,
                            scoreRate: { "1-0": 1 }
                        },
                        overUnderValue: 2.5,
                        handicapValue: 0
                    };

                    // Act
                    const result = getSettlementResult(roundResult, matchConfig);

                    // Assert
                    expect(result[1].ft_oe_even).toBe(SettlementStatus.WIN);
                });
            });

            describe("first half even", () => {
                it("ft_oe_odd should be W", () => {
                    // Arrange
                    const roundResult = {
                        drawResults: [
                            { 
                                playlist: "test-video-1",
                                goalInfo: "test-video-1",
                                result: { goalSequence: 'HH', finalScore: '2:0' } 
                            },
                            { 
                                playlist: "test-video-2",
                                goalInfo: "test-video-2",
                                result: { goalSequence: 'H', finalScore: '1:0' } 
                            }
                        ]
                    };
                    const matchConfig = {
                        firstHalf: { 
                            overUnderValue: 1.5, 
                            handicapValue: 0,
                            scoreRate: { "0-1": 1 }
                        },
                        secondHalf: { 
                            overUnderValue: 1.5, 
                            handicapValue: 0,
                            scoreRate: { "1-0": 1 }
                        },
                        overUnderValue: 2.5,
                        handicapValue: 0
                    };

                    // Act
                    const result = getSettlementResult(roundResult, matchConfig);

                    // Assert
                    expect(result[0].ft_oe_odd).toBe(SettlementStatus.WIN);
                });

                it("ft_oe_even should be L", () => {
                    // Arrange
                    const roundResult = {
                        drawResults: [
                            { 
                                playlist: "test-video-1",
                                goalInfo: "test-video-1",
                                result: { goalSequence: 'HH', finalScore: '2:0' } 
                            },
                            { 
                                playlist: "test-video-2",
                                goalInfo: "test-video-2",
                                result: { goalSequence: 'H', finalScore: '1:0' } 
                            }
                        ]
                    };
                    const matchConfig = {
                        firstHalf: { 
                            overUnderValue: 1.5, 
                            handicapValue: 0,
                            scoreRate: { "0-1": 1 }
                        },
                        secondHalf: { 
                            overUnderValue: 1.5, 
                            handicapValue: 0,
                            scoreRate: { "1-0": 1 }
                        },
                        overUnderValue: 2.5,
                        handicapValue: 0
                    };

                    // Act
                    const result = getSettlementResult(roundResult, matchConfig);

                    // Assert
                    expect(result[1].ft_oe_even).toBe(SettlementStatus.LOSE);
                });
            });
        });

        describe("even", () => {
            describe("first half odd", () => {
                it("ft_oe_odd should be L", () => {
                    // Arrange
                    const roundResult = {
                        drawResults: [
                            { 
                                playlist: "test-video-2",
                                goalInfo: "test-video-2",
                                result: { goalSequence: 'H', finalScore: '1:0' } 
                            },
                            { 
                                playlist: "test-video-2",
                                goalInfo: "test-video-2",
                                result: { goalSequence: 'H', finalScore: '1:0' } 
                            }
                        ]
                    };
                    const matchConfig = {
                        firstHalf: { 
                            overUnderValue: 1.5, 
                            handicapValue: 0,
                            scoreRate: { "0-1": 1 }
                        },
                        secondHalf: { 
                            overUnderValue: 1.5, 
                            handicapValue: 0,
                            scoreRate: { "1-0": 1 }
                        },
                        overUnderValue: 2.5,
                        handicapValue: 0
                    };

                    // Act
                    const result = getSettlementResult(roundResult, matchConfig);

                    // Assert
                    expect(result[1].ft_oe_odd).toBe(SettlementStatus.LOSE);
                });

                it("ft_oe_even should be W", () => {
                    // Arrange
                    const roundResult = {
                        drawResults: [
                            { 
                                playlist: "test-video-2",
                                goalInfo: "test-video-2",
                                result: { goalSequence: 'H', finalScore: '1:0' } 
                            },
                            { 
                                playlist: "test-video-2",
                                goalInfo: "test-video-2",
                                result: { goalSequence: 'H', finalScore: '1:0' } 
                            }
                        ]
                    };
                    const matchConfig = {
                        firstHalf: { 
                            overUnderValue: 1.5, 
                            handicapValue: 0,
                            scoreRate: { "0-1": 1 }
                        },
                        secondHalf: { 
                            overUnderValue: 1.5, 
                            handicapValue: 0,
                            scoreRate: { "1-0": 1 }
                        },
                        overUnderValue: 2.5,
                        handicapValue: 0
                    };

                    // Act
                    const result = getSettlementResult(roundResult, matchConfig);

                    // Assert
                    expect(result[1].ft_oe_even).toBe(SettlementStatus.WIN);
                });
            });

            describe("first half even", () => {
                it("ft_oe_odd should be L", () => {
                    // Arrange
                    const roundResult = {
                        drawResults: [
                            { 
                                playlist: "test-video-1",
                                goalInfo: "test-video-1",
                                result: { goalSequence: 'HH', finalScore: '2:0' } 
                            },
                            { 
                                playlist: "test-video-1",
                                goalInfo: "test-video-1",
                                result: { goalSequence: 'HH', finalScore: '2:0' } 
                            }
                        ]
                    };
                    const matchConfig = {
                        firstHalf: { 
                            overUnderValue: 1.5, 
                            handicapValue: 0,
                            scoreRate: { "0-1": 1 }
                        },
                        secondHalf: { 
                            overUnderValue: 1.5, 
                            handicapValue: 0,
                            scoreRate: { "1-0": 1 }
                        },
                        overUnderValue: 3.5,
                        handicapValue: 0
                    };

                    // Act
                    const result = getSettlementResult(roundResult, matchConfig);

                    // Assert
                    expect(result[1].ft_oe_odd).toBe(SettlementStatus.LOSE);
                });

                it("ft_oe_even should be W", () => {
                    // Arrange
                    const roundResult = {
                        drawResults: [
                            { 
                                playlist: "test-video-1",
                                goalInfo: "test-video-1",
                                result: { goalSequence: 'HH', finalScore: '2:0' } 
                            },
                            { 
                                playlist: "test-video-1",
                                goalInfo: "test-video-1",
                                result: { goalSequence: 'HH', finalScore: '2:0' } 
                            }
                        ]
                    };
                    const matchConfig = {
                        firstHalf: { 
                            overUnderValue: 1.5, 
                            handicapValue: 0,
                            scoreRate: { "0-1": 1 }
                        },
                        secondHalf: { 
                            overUnderValue: 1.5, 
                            handicapValue: 0,
                            scoreRate: { "1-0": 1 }
                        },
                        overUnderValue: 3.5,
                        handicapValue: 0
                    };

                    // Act
                    const result = getSettlementResult(roundResult, matchConfig);

                    // Assert
                    expect(result[1].ft_oe_even).toBe(SettlementStatus.WIN);
                });
            });
        });
    });
});
