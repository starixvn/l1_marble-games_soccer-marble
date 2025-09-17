# @soccer-marble/shared-utils

Shared utility functions for soccer marble applications.

## Features

- **Crypto Helper**: Encryption and decryption utilities for sensitive data
- **ID Helper**: Event ID generation and parsing utilities
- **Odds Helper**: Common odds calculation functions
- **Result Helper**: Common result generation and settlement functions

## Usage

```typescript
import { idHelper, cryptoHelper, parseScore, calculateHandicapValue } from "@soccer-marble/shared-utils";

// Generate event ID
const eventId = idHelper.createEventId(gameId, roundId);

// Encrypt/decrypt data
const encrypted = cryptoHelper.encrypt(sensitiveData);
const decrypted = cryptoHelper.decrypt(encrypted);

// Parse score
const [home, away] = parseScore("2-1");

// Calculate handicap value
const handicap = calculateHandicapValue(1.5, 2.0);
```

## Available Functions

### Crypto Helper

- `encrypt(data: any)`: Encrypt data using AES-256-CTR
- `decrypt(encrypted: any)`: Decrypt data

### ID Helper

- `createEventId(gameId: number, roundId: number)`: Create event ID from game and round IDs
- `extractGameId(eventId: number)`: Extract game ID from event ID
- `extractRoundId(eventId: number)`: Extract round ID from event ID

### Odds Helper

- `parseScore(score: string)`: Parse score string to home/away numbers
- `roundToPrecision(value: number, precision?: number)`: Round to specified precision
- `calculateHandicapValue(homeScore: number, awayScore: number)`: Calculate handicap value
- `calculateOverUnderValue(homeScore: number, awayScore: number)`: Calculate over/under value
- `calculateProbabilitiesForBetChoices(scoreRates: Record<string, number>, addingScore?: string)`: Calculate betting probabilities
- `calculateBetOdds(probabilities: Record<string, number>)`: Calculate betting odds
- `probabilityToBetRawOdds(prob: number)`: Convert probability to raw odds

### Result Helper

- `generateResult(data: DataResultType)`: Generate game result
- `getSettlementResult(roundResult: RoundResultType, matchConfig: MatchConfigType)`: Calculate settlement result
- `getScoreFromScoreRate(scoreRate: Record<string, number>)`: Get score from rate configuration
- `generateVideoName(result: string, numberOfVideos: Record<string, number>, videoDefault?: boolean, ignoredVideo?: string)`: Generate video name

## Dependencies

- `sc-core-rng`: Secure random number generation
- `crypto`: Node.js crypto module for encryption
