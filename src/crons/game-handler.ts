import { AppContainer, GameRunningRound, GameSettings, Selection } from "../types";
import { RoundService } from "../services/round-service";
import { EventService } from "../services/event-service";
import { RoundGeneratorService } from "../services/round-generator-service";
import { logger } from "sc-common";
import { decrypt } from "../helpers/crypto-helper";
import { IRound } from "../models/rounds";
import { GameData } from "./game-data";
import { Scheduler } from "./scheduler";
import { Schema } from "mongoose";
import { IEventDetail } from "../models/event-details";

export class GameHandler {
  private readonly roundService: RoundService;
  private readonly eventService: EventService;
  private readonly roundGeneratorService: RoundGeneratorService;
  private readonly logService: typeof logger;
  private readonly gameData: GameData;
  private readonly scheduler: Scheduler;
  private readonly gameSettings: GameSettings;

  constructor(container: AppContainer) {
    this.logService = container.logService;
    this.roundService = container.roundService;
    this.eventService = container.eventService;
    this.roundGeneratorService = container.roundGeneratorService;
    this.gameData = container.gameData;
    this.scheduler = container.scheduler;
    this.gameSettings = container.gameSettings;
  }

  async loadRoundFromRoundId(roundId: number) {
    const newRound = await this.roundService.fetchRoundData(roundId);

    return {
      ...newRound,
      roundTime: 1,
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
    if (!this.gameData.gameConfig?.enabled) {
      this.logService.log("Game is not enabled, skipping upcoming round and event creation", "info");
      return;
    }

    console.log("createUpcomingRoundAndEvent: ", roundId);

    const newRound = this.roundGeneratorService.generateNewRound(roundId);

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
  }

  async handleVideoInfoAvailableForEventDetail(drawIndex: number, eventDetailId: Schema.Types.ObjectId, roundId: number) {
    const eventDetail = await this.eventService.fetchEventDetail(eventDetailId);
    const round = await this.loadRoundFromRoundId(roundId);
    eventDetail.playlist = round.result.drawResults[drawIndex].playlist;
    eventDetail.goalInfo = round.result.drawResults[drawIndex].goalInfo;

    await this.eventService.updateEventDetail(eventDetail, ["playlist", "goalInfo"]);
  }

  async handleResultAvailableForEventDetail(drawIndex: number, eventDetailId: Schema.Types.ObjectId, roundId: number) {
    const eventDetail = await this.eventService.fetchEventDetail(eventDetailId);
    const round = await this.loadRoundFromRoundId(roundId);
    eventDetail.hasResults = true;
    eventDetail.result = round.result.drawResults[drawIndex].result;
    eventDetail.selections?.forEach((selection: Selection) => {
      selection.settlementStatus = round.settlementResult[drawIndex][selection.name];
    });

    await this.eventService.updateEventDetail(eventDetail, ["result", "hasResults", "selections"]);

    if (drawIndex === this.gameSettings.gameTiming.timelines.length - 1) {
      await this.handleRoundEnded(roundId);
    }
  }

  async handleRoundEnded(roundId: number) {
    const round = await this.roundService.fetchRoundData(roundId);
    round.ended = true;
    round.selections = decrypt(round.encryptedSelections);
    round.result = decrypt(round.encryptedResult);
    round.settlementResult = decrypt(round.encryptedSettlementResult);
    await this.roundService.updateRound(round);
  }
}
