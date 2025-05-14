import { AppContainer, Selection, GameSettings, GameRunningRound } from "../types";
import { RoundService } from "../services/round-service";
import { EventService } from "../services/event-service";
import { RoundGeneratorService } from "../services/round-generator-service";
import { logger } from "sc-common";
import { decrypt } from "../helpers/crypto-helper";
import { GameConfigService } from "../services/game-config-service";
import { IRound } from "../models/rounds";

export class GameStateManager {
  private readonly roundService: RoundService;
  private readonly eventService: EventService;
  private readonly roundGeneratorService: RoundGeneratorService;
  private readonly gameConfigService: GameConfigService;
  private readonly gameSettings: GameSettings;
  private readonly logService: typeof logger;

  private enabled = false;
  private round = { roundTime: 0, ended: true } as GameRunningRound;
  private eventDetails: any[] = [];
  private readonly upcomingRounds: number[] = [];

  constructor(container: AppContainer) {
    this.gameSettings = container.gameSettings;
    this.logService = container.logService;
    this.roundService = container.roundService;
    this.eventService = container.eventService;
    this.roundGeneratorService = container.roundGeneratorService;
    this.gameConfigService = container.gameConfigService;
  }

  setRoundId(id: number) {
    this.round.roundId = id;
  }

  isBeforeStartNewRound() {
    return this.round.roundTime === 0;
  }

  isAtStartNewRound() {
    return this.round.roundTime === 1;
  }

  isAtRoundEnded() {
    return this.round.roundTime >= this.gameSettings.gameTiming.wholeRound;
  }

  shouldScheduleUpcomingRounds() {
    return this.enabled && this.upcomingRounds.length === 0;
  }

  shouldAdvanceRound() {
    return this.enabled || this.upcomingRounds.length > 0 || !this.round.ended;
  }

  advanceRound() {
    this.round.roundTime++;
  }

  getCurrentRoundTime() {
    return this.round.roundTime;
  }

  async setGameEnabled() {
    const gameConfig = await this.gameConfigService.getGameConfig();

    if (!gameConfig) {
      this.enabled = false;
      this.logService.logError("Game config not found");
      return;
    }

    this.enabled = gameConfig.enabled;
  }

  async startNewRound() {
    const nextRoundId = this.upcomingRounds.shift();

    if (!nextRoundId) {
      this.logService.logError("No upcoming round found");
      return;
    }

    const newRound = await this.roundService.fetchRoundData(nextRoundId);
    const event = await this.eventService.fetchEvent(newRound.eventID);
    const eventDetails = await Promise.all(event.eventDetails.map((id) => this.eventService.fetchEventDetail(id)));

    this.eventDetails = eventDetails;
    this.round = {
      ...newRound,
      roundTime: 1,
      result: decrypt(newRound.encryptedResult),
      settlementResult: decrypt(newRound.encryptedSettlementResult),
      selections: decrypt(newRound.encryptedSelections),
    };
  }

  async endCurrentRound() {
    this.round.roundTime = 0;
    this.round.ended = true;
    await this.roundService.insertOrUpdateRound(this.round as IRound);
  }

  async createUpcomingRoundAndEvent(offsetFromCurrent: number): Promise<void> {
    if (!this.enabled) {
      this.logService.log("Game is not enabled, skipping upcoming round and event creation", "info");
      return;
    }

    const upcomingRoundId = this.round.roundId + offsetFromCurrent;
    this.upcomingRounds.push(upcomingRoundId);
    const newRound = this.roundGeneratorService.generateNewRound(upcomingRoundId);

    await this.roundService.insertOrUpdateRound(newRound as IRound);
    const event = await this.eventService.createNewEvent(newRound, offsetFromCurrent);
    const firstEventDetail = await this.eventService.fetchEventDetail(event.eventDetails[0]);

    const selections = decrypt(newRound.encryptedSelections);
    firstEventDetail.selections = Object.values(selections[0]);
    firstEventDetail.oddsAvailableTs = new Date();

    await this.eventService.updateEventDetail(firstEventDetail, ["selections", "oddsAvailableTs"]);
  }

  async updateOddsForDraw(drawIndex: number) {
    const eventDetail = this.eventDetails[drawIndex];
    eventDetail.selections = Object.values(this.round.selections[drawIndex]);
    await this.eventService.updateEventDetail(eventDetail, ["selections"]);
  }

  async updateVideoInfoForDraw(drawIndex: number) {
    const eventDetail = this.eventDetails[drawIndex];
    eventDetail.playlist = this.round.result.drawResults[drawIndex].playlist;
    eventDetail.goalInfo = this.round.result.drawResults[drawIndex].goalInfo;

    await this.eventService.updateEventDetail(eventDetail, ["playlist", "goalInfo"]);
  }

  async updateResultForDraw(drawIndex: number) {
    const eventDetail = this.eventDetails[drawIndex];
    eventDetail.hasResults = true;
    eventDetail.result = this.round.result.drawResults[drawIndex].result;
    await this.eventService.updateEventDetail(eventDetail, ["result", "hasResults"]);
  }

  async updateSettlementResult() {
    await Promise.all(
      this.eventDetails.map((eventDetail, drawIndex) => {
        eventDetail.selections.forEach((selection: Selection) => {
          selection.settlementStatus = this.round.settlementResult[drawIndex][selection.name];
        });
        return this.eventService.updateEventDetail(eventDetail, ["selections"]);
      })
    );
  }

  async settleRound() {
    await this.updateSettlementResult();
    await this.endCurrentRound();
  }
}
