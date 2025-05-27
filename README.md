# Soccer Event Generation Service

A Node.js service that generates soccer game events with MongoDB storage. The service automatically generates events at specific intervals and updates them based on scheduled times.

## Features

- Automatic event generation at configurable intervals
- Event details are updated at scheduled times
- Recovery mechanism for missed updates if service crashes
- RESTful API for accessing events
- MongoDB storage for persistence

## Project Structure

```
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # API controllers
│   ├── models/         # MongoDB models
│   ├── routes/         # API routes
│   ├── services/       # Business logic services
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   └── index.ts        # Application entry point
├── .env                # Environment variables
├── .gitignore          # Git ignore file
├── package.json        # Project dependencies
├── tsconfig.json       # TypeScript configuration
└── README.md           # Project documentation
```

## Event Schema

```typescript
interface Event {
  _id: MongoObjectId;
  eventID: number; // Sequential ID
  eventNameAKey: string; // Home team
  eventNameBKey: string; // Away team
  gameId: number;
  eventDetails: EventDetail[]; // Array of event details (halves)
  scheduleStartTs: DateTime;
}

interface EventDetail {
  scheduleStartTs: DateTime;
  resultsAvailableTs: DateTime;
  playlist?: string; // Video URL
  goalInfo?: string; // JSON URL
  selections?: Selection[]; // Bet choices
  result?: Object;
}

interface Selection {
  name: string;
  price: number; // Bet odds
  settlementStatus: string; // Play, Lose, Win, Draw
}
```

## Event Generation Process

1. Every specific time (configured in `.env`), the service generates a configurable number of events
2. Each event has two event details (corresponding to two halves of a game match)
3. At generation time, only `scheduleStartTs`, `resultsAvailableTs` are stored
4. At `scheduleStartTs`, the service generates `playlist`, `goalInfo`, and `selections` data and updates the event
5. At `resultsAvailableTs`, the service decrypts the result and updates the event

## Recovery Mechanism

If the service crashes and restarts:

1. It checks if there are enough future events in the database
2. If not, it generates new events
3. It checks for any missed updates and applies them

## Configuration

Configuration is done through environment variables in the `.env` file:

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/soccer-events
ENCRYPTION_KEY=your-secret-encryption-key
NODE_ENV=development

# Game Configuration
EVENTS_PER_GENERATION=4
GAME_HALF_DURATION_SECONDS=60
BREAK_DURATION_SECONDS=30
GENERATION_INTERVAL_MINUTES=10
```

## API Endpoints

- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get event by ID
- `POST /api/events/generate` - Manually trigger event generation
- `POST /api/events/check-missed` - Manually check and update missed events
- `GET /health` - Health check endpoint

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Configure the `.env` file
4. Build the project:
   ```
   npm run build
   ```
5. Start the service:
   ```
   npm start
   ```

For development:

```
npm run dev
```

## License

This project is licensed under the ISC License.
