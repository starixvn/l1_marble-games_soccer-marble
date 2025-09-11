# Soccer Marble Monorepo

This monorepo contains the soccer marble game applications and shared packages using npm workspaces.

## Structure

```
soccer-marble/
├── apps/
│   ├── 2004/                    # @soccer-marble/2004 - Soccer marble game 2004 service
│   └── soccer-marble/           # @soccer-marble/soccer-marble - Main soccer marble service
├── packages/
│   ├── shared-types/            # @soccer-marble/shared-types - Shared TypeScript types
│   └── shared-utils/            # @soccer-marble/shared-utils - Shared utility functions
├── package.json                 # Root workspace configuration
├── .npmrc                       # NPM configuration
└── README.md                    # This file
```

## Features

- **Monorepo Management**: Single repository for multiple related packages
- **Shared Dependencies**: Common types and utilities shared across apps
- **Independent Apps**: Each app can be developed and deployed independently
- **Workspace Scripts**: Convenient scripts to manage all workspaces
- **Type Safety**: Shared TypeScript types across all packages

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0

### Installation

```bash
# Install all dependencies for all workspaces
npm install
```

### Development

```bash
# Run all apps in development mode
npm run dev

# Run specific app in development mode
npm run app:2004:dev
npm run app:soccer-marble:dev
```

### Building

```bash
# Build all packages and apps
npm run build

# Build specific app
npm run app:2004:build
npm run app:soccer-marble:build
```

### Testing

```bash
# Run tests for all workspaces
npm run test

# Run tests for specific app
npm run app:2004:test
npm run app:soccer-marble:test

# Run tests with coverage
npm run test:coverage
```

## Available Scripts

### Root Level Scripts

- `npm run build` - Build all workspaces
- `npm run dev` - Start development mode for all workspaces
- `npm run test` - Run tests for all workspaces
- `npm run test:coverage` - Run tests with coverage for all workspaces
- `npm run clean` - Clean build artifacts for all workspaces
- `npm run type-check` - Type check all workspaces
- `npm run install:all` - Install dependencies for all workspaces
- `npm run update:deps` - Update dependencies for all workspaces

### App-Specific Scripts

- `npm run app:2004:dev` - Start 2004 app in development mode
- `npm run app:2004:build` - Build 2004 app
- `npm run app:2004:start` - Start 2004 app in production mode
- `npm run app:2004:test` - Run tests for 2004 app

- `npm run app:soccer-marble:dev` - Start soccer-marble app in development mode
- `npm run app:soccer-marble:build` - Build soccer-marble app
- `npm run app:soccer-marble:start` - Start soccer-marble app in production mode
- `npm run app:soccer-marble:test` - Run tests for soccer-marble app

## Workspaces

### Apps

- **@soccer-marble/2004** - Soccer marble game 2004 service
- **@soccer-marble/soccer-marble** - Main soccer marble service

### Packages

- **@soccer-marble/shared-types** - Shared TypeScript type definitions
- **@soccer-marble/shared-utils** - Shared utility functions

## Adding Dependencies

### To a specific workspace

```bash
# Add dependency to specific app
npm install express --workspace=@soccer-marble/2004

# Add dev dependency to specific app
npm install -D @types/express --workspace=@soccer-marble/2004
```

### To root (affects all workspaces)

```bash
# Add dependency to root
npm install -w typescript
```

### To all workspaces

```bash
# Add dependency to all workspaces
npm install lodash --workspaces
```

## Adding a New Workspace

1. Create the new workspace directory in `apps/` or `packages/`
2. Add a `package.json` with a unique name following the `@soccer-marble/` scope
3. Run `npm install` to update the workspace configuration

## Workspace Commands

### Running commands in specific workspaces

```bash
# Run command in specific workspace
npm run build --workspace=@soccer-marble/2004

# Run command in multiple workspaces
npm run test --workspaces --if-present

# Run command in all workspaces
npm run build --workspaces
```

### Managing dependencies

```bash
# List all workspaces
npm ls --workspaces

# Install dependency in specific workspace
npm install package-name --workspace=@soccer-marble/2004

# Update dependencies in all workspaces
npm update --workspaces
```

## Configuration

The monorepo uses npm workspaces for dependency management. The workspace configuration is defined in the root `package.json` file.

### .npmrc Configuration

The `.npmrc` file contains npm configuration for the monorepo:

- `save-exact=true` - Save exact versions
- `package-lock=true` - Generate package-lock.json
- `fund=false` - Disable funding messages
- `audit=false` - Disable audit messages

## Development Workflow

1. **Start development**: `npm run dev` to start all apps
2. **Make changes**: Edit code in the appropriate workspace
3. **Run tests**: `npm run test` to test all workspaces
4. **Build**: `npm run build` to build all workspaces
5. **Deploy**: Deploy individual apps as needed

## Contributing

1. Make changes in the appropriate workspace
2. Run tests to ensure everything works: `npm run test`
3. Build the project: `npm run build`
4. Commit your changes

## License

This project is licensed under the ISC License.
