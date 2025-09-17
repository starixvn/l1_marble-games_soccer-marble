# @soccer-marble/shared-types

Shared TypeScript types for soccer marble applications.

## Features

- **Common Types**: Shared interfaces and types used across soccer marble apps
- **Enums**: Common enumerations for game states and configurations
- **Type Safety**: Ensures consistency across different applications

## Usage

```typescript
import { SettlementStatus, Selection, EventDetail, MatchConfigType, GameSettings } from "@soccer-marble/shared-types";

// Use shared types
const selection: Selection = {
  name: "home_win",
  price: 2.5,
  point: 0,
  settlementStatus: SettlementStatus.PLAY,
};

const eventDetail: EventDetail = {
  eventID: 12345,
  oddsAvailableTs: new Date(),
  scheduleStartTs: new Date(),
  resultsAvailableTs: new Date(),
  hasResults: false,
};
```

## Available Types

### Core Types

- `RateConfig`: Score rate configuration
- `HalfConfigType`: Half configuration with odds values
- `MatchConfigType`: Complete match configuration
- `Selection`: Betting selection with odds and settlement
- `EventDetail`: Event detail with timing and results
- `DrawResultType`: Draw result with video information
- `RoundResultType`: Complete round result
- `Event`: Event with teams and timing

### Enums

- `SettlementStatus`: Betting settlement status (PLAY, LOSE, WIN, DRAW)
- `Phase`: Game phases (OddsAvailable, ScheduleStart, ResultAvailable)
- `JobName`: Job names for scheduling
- `FirstHalfOddsKey`: First half betting keys
- `SecondHalfOddsKey`: Second half betting keys

### Configuration Types

- `GameSettings`: Game configuration settings
- `GameTiming`: Game timing configuration
- `Timeline`: Timeline configuration
- `DataResultType`: Data for result generation
- `GameRunningRound`: Running game round data
- `GameConfig`: Game configuration
- `Match`: Match information
- `ConfigData`: Configuration data

### Settlement Types

- `DrawSettlementResultType`: Settlement result for a draw
- `RoundSettlementResultType`: Settlement results for a round

## Type Safety

All types are designed to be compatible across different soccer marble applications while allowing for app-specific extensions when needed.
