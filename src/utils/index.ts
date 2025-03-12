import CryptoJS from "crypto-js";
import moment from "moment";
import { ENCRYPTION_KEY } from "../config";
import { EventDetail, Selection, SettlementStatus } from "../types";

/**
 * Encrypt data using AES encryption
 * @param data - Data to encrypt
 * @returns Encrypted data
 */
export const encryptData = (data: any): Record<string, any> => {
  const jsonString = JSON.stringify(data);
  const encrypted = CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
  return { encrypted };
};

/**
 * Decrypt data using AES decryption
 * @param encryptedData - Encrypted data
 * @returns Decrypted data
 */
export const decryptData = (encryptedData: Record<string, any>): any => {
  const bytes = CryptoJS.AES.decrypt(encryptedData.encrypted, ENCRYPTION_KEY);
  const decrypted = bytes.toString(CryptoJS.enc.Utf8);
  return JSON.parse(decrypted);
};

/**
 * Generate random team names
 * @returns Object with home and away team names
 */
export const generateTeamNames = (): { home: string; away: string } => {
  const teams = [
    "Arsenal",
    "Chelsea",
    "Liverpool",
    "Manchester United",
    "Manchester City",
    "Tottenham",
    "Barcelona",
    "Real Madrid",
    "Atletico Madrid",
    "Bayern Munich",
    "Borussia Dortmund",
    "PSG",
    "Juventus",
    "AC Milan",
    "Inter Milan",
  ];

  // Get two random unique teams
  const shuffled = [...teams].sort(() => 0.5 - Math.random());
  const [home, away] = shuffled.slice(0, 2);

  return { home, away };
};

/**
 * Generate random selections (betting options)
 * @returns Array of Selection objects
 */
export const generateSelections = (): Selection[] => {
  // Common betting options: home win, away win, draw
  return [
    {
      name: "Home Win",
      price: parseFloat((1 + Math.random() * 3).toFixed(2)),
      settlementStatus: SettlementStatus.PLAY,
    },
    {
      name: "Draw",
      price: parseFloat((2 + Math.random() * 2).toFixed(2)),
      settlementStatus: SettlementStatus.PLAY,
    },
    {
      name: "Away Win",
      price: parseFloat((1 + Math.random() * 3).toFixed(2)),
      settlementStatus: SettlementStatus.PLAY,
    },
  ];
};

/**
 * Generate a random result
 * @returns Result object
 */
export const generateResult = (): Record<string, any> => {
  const homeScore = Math.floor(Math.random() * 5);
  const awayScore = Math.floor(Math.random() * 5);

  let winner: string;
  if (homeScore > awayScore) {
    winner = "Home Win";
  } else if (homeScore < awayScore) {
    winner = "Away Win";
  } else {
    winner = "Draw";
  }

  return {
    homeScore,
    awayScore,
    winner,
  };
};

/**
 * Calculate event times based on start time and durations
 * @param startTime - Event start time
 * @param halfDuration - Duration of each half in seconds
 * @param breakDuration - Duration of break between halves in seconds
 * @returns Object with calculated times
 */
export const calculateEventTimes = (
  startTime: Date,
  halfDuration: number,
  breakDuration: number
): {
  firstHalfStart: Date;
  firstHalfEnd: Date;
  secondHalfStart: Date;
  secondHalfEnd: Date;
} => {
  const firstHalfStart = moment(startTime);
  const firstHalfEnd = moment(firstHalfStart).add(halfDuration, "seconds");
  const secondHalfStart = moment(firstHalfEnd).add(breakDuration, "seconds");
  const secondHalfEnd = moment(secondHalfStart).add(halfDuration, "seconds");

  return {
    firstHalfStart: firstHalfStart.toDate(),
    firstHalfEnd: firstHalfEnd.toDate(),
    secondHalfStart: secondHalfStart.toDate(),
    secondHalfEnd: secondHalfEnd.toDate(),
  };
};

/**
 * Generate event details for a new event
 * @param startTime - Event start time
 * @param halfDuration - Duration of each half in seconds
 * @param breakDuration - Duration of break between halves in seconds
 * @returns Array of EventDetail objects
 */
export const generateEventDetails = (startTime: Date, halfDuration: number, breakDuration: number): EventDetail[] => {
  const times = calculateEventTimes(startTime, halfDuration, breakDuration);

  // Generate results for both halves
  const firstHalfResult = generateResult();
  const secondHalfResult = generateResult();

  // Create encrypted results
  const encryptedFirstHalf = encryptData(firstHalfResult);
  const encryptedSecondHalf = encryptData(secondHalfResult);

  return [
    {
      scheduleStartTs: times.firstHalfStart,
      resultsAvailableTs: times.firstHalfEnd,
      encryptedResult: encryptedFirstHalf,
    },
    {
      scheduleStartTs: times.secondHalfStart,
      resultsAvailableTs: times.secondHalfEnd,
      encryptedResult: encryptedSecondHalf,
    },
  ];
};
