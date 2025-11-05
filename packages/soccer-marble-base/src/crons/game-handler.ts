import { AppContainer, GameRunningRound, GameSettings, RoundResult, Selection } from "../types";
import { RoundService } from "../services/round-service";
import { EventService } from "../services/event-service";
import { RoundGeneratorService } from "../services/round-generator-service";
import { logger } from "sc-common";
import { decrypt } from "@soccer-marble/shared-utils";
import { IRound } from "../models/rounds";
import { GameData } from "./game-data";
import { Scheduler } from "./scheduler";
import { Schema } from "mongoose";
import { IEventDetail } from "../models/event-details";

const maxDelay = 1000;

export class GameHandler {
  protected readonly roundService: RoundService;
  protected readonly eventService: EventService;
  protected readonly roundGeneratorService: RoundGeneratorService;
  protected readonly logService: typeof logger;
  protected readonly gameData: GameData;
  protected readonly scheduler: Scheduler;
  protected readonly gameSettings: GameSettings;

  constructor(container: AppContainer) {
    this.logService = container.logService;
    this.roundService = container.roundService;
    this.eventService = container.eventService;
    this.roundGeneratorService = container.roundGeneratorService;
    this.gameData = container.gameData;
    this.scheduler = container.scheduler;
    this.gameSettings = container.gameSettings;
  }

  async delayTime(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async loadRoundFromRoundId(roundId: number): Promise<GameRunningRound> {
    const newRound = await this.roundService.fetchRoundData(roundId);

    return {
      ...newRound,
      result: decrypt(newRound.encryptedResult),
      settlementResult: decrypt(newRound.encryptedSettlementResult),
      selections: decrypt(newRound.encryptedSelections),
    };
  }

  async loadEventDetailsFromEventId(eventId: number) {
    const event = await this.eventService.fetchEvent(eventId);

    if (!event) {
      throw new Error(`Event not found for eventId ${eventId}`);
    }

    return Promise.all(event.eventDetails.map((id) => this.eventService.fetchEventDetail(id)));
  }

  async createUpcomingRoundAndEvent(roundId: number, scheduleStartTs: Date): Promise<void> {
    if (!this.gameData.gameConfig?.config?.enabled) {
      this.logService.log("Game is not enabled, skipping upcoming round and event creation", "info");
      return;
    }

    const newRound = this.roundGeneratorService.generateNewRoundWithRetry(roundId);

    await this.roundService.insertRound(newRound as IRound);
    const event = await this.eventService.createNewEvent(newRound, scheduleStartTs);
    const eventDetails = await this.loadEventDetailsFromEventId(event.eventID);

    await Promise.all(
      eventDetails.map((eventDetail, drawIndex) => this.scheduler.scheduleUpdateEventDetail(eventDetail, drawIndex))
    );

    await this.updateSelectionsForFirstEventDetail(eventDetails[0], newRound);
  }

  async updateSelectionsForFirstEventDetail(eventDetail: IEventDetail, round: GameRunningRound) {
    const selections = decrypt(round.encryptedSelections);
    eventDetail.selections = Object.values(selections[0]);
    eventDetail.oddsAvailableTs = new Date();

    await this.eventService.updateEventDetail(eventDetail, ["selections", "oddsAvailableTs"]);
  }

  async handleOddsAvailableForEventDetail(drawIndex: number, eventDetailId: Schema.Types.ObjectId, roundId: number) {
    const eventDetail = await this.eventService.fetchEventDetail(eventDetailId);
    const round = await this.loadRoundFromRoundId(roundId);
    eventDetail.selections = Object.values(round.selections[drawIndex]);

    await this.eventService.updateEventDetail(eventDetail, ["selections"]);

    const delay = new Date().getTime() - eventDetail.oddsAvailableTs.getTime();

    if (drawIndex > 0 && Math.abs(delay) > maxDelay) {
      this.logService.logWarning(`Odds available for event detail ${eventDetailId} is late by: ${delay}ms`);
    }
  }

  async handleVideoInfoAvailableForEventDetail(
    drawIndex: number,
    eventDetailId: Schema.Types.ObjectId,
    roundId: number
  ) {
    const eventDetail = await this.eventService.fetchEventDetail(eventDetailId);
    const round = await this.loadRoundFromRoundId(roundId);
    const roundResult = this.getRoundResult(round);
    eventDetail.playlist = roundResult[drawIndex].playlist;
    eventDetail.goalInfo = roundResult[drawIndex].goalInfo;

    await this.eventService.updateEventDetail(eventDetail, ["playlist", "goalInfo"]);

    const delay = new Date().getTime() - eventDetail.scheduleStartTs.getTime();

    if (Math.abs(delay) > maxDelay) {
      this.logService.logWarning(`Video info available for event detail ${eventDetailId} is late by: ${delay}ms`);
    }
  }

  async handleResultAvailableForEventDetail(drawIndex: number, eventDetailId: Schema.Types.ObjectId, roundId: number) {
    const eventDetail = await this.eventService.fetchEventDetail(eventDetailId);
    const round = await this.loadRoundFromRoundId(roundId);
    eventDetail.hasResults = true;
    const roundResult = this.getRoundResult(round);
    eventDetail.result = roundResult[drawIndex].result;

    await this.eventService.updateEventDetail(eventDetail, ["result", "hasResults"]);

    const delay = new Date().getTime() - eventDetail.resultsAvailableTs.getTime();

    if (Math.abs(delay) > maxDelay) {
      this.logService.logWarning(`Result available for event detail ${eventDetailId} is late by: ${delay}ms`);
    }

    if (drawIndex === this.getLastEventDetailIndex(round)) {
      await this.handleUpdateSettlementResult(round);
      await this.handleRoundEnded(roundId);
    }
  }

  async handleUpdateSettlementResult(round: GameRunningRound) {
    let eventDetails = await this.loadEventDetailsFromEventId(round.eventID);
    const lastEventDetailIndex = this.getLastEventDetailIndex(round);

    if (!eventDetails[lastEventDetailIndex].selections?.length) {
      await this.delayTime(1000); // delay to ensure event detail selections are updated
      eventDetails = await this.loadEventDetailsFromEventId(round.eventID);
    }

    await Promise.all(
      eventDetails.map((eventDetail, drawIndex) => {
        eventDetail.selections?.forEach((selection: Selection) => {
          selection.settlementStatus = round.settlementResult[drawIndex][selection.name];
        });
        return this.eventService.updateEventDetail(eventDetail, ["selections"]);
      })
    );
  }

  async handleRoundEnded(roundId: number) {
    const round = await this.roundService.fetchRoundData(roundId);
    round.ended = true;
    round.selections = decrypt(round.encryptedSelections);
    round.result = decrypt(round.encryptedResult);
    round.settlementResult = decrypt(round.encryptedSettlementResult);
    await this.roundService.updateRound(round);
  }

  getRoundResult(round: GameRunningRound): RoundResult {
    const oldRoundResult = (round.result as any)?.drawResults ?? [];
    return oldRoundResult.length > 0 ? oldRoundResult : round.result;
  }

  getLastEventDetailIndex(round: GameRunningRound): number {
    const numberOfEventDetails =
      round.matchConfig.numberOfEventDetails ?? this.gameSettings.gameTiming.timelines.length;

    return numberOfEventDetails - 1;
  }
}
