# Yahtzee Balatro

## Overview

A roguelike dice game that combines Yahtzee hand mechanics with Balatro-style deck building. Players roll 3D physics-based dice, form poker-style hands to deal damage to enemies, and progress through stages while collecting jokers, consumables, and upgrades in a shop system.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state, local React state for UI
- **Styling**: Tailwind CSS v4 with shadcn/ui component library (New York style)
- **3D Rendering**: React Three Fiber with @react-three/cannon for physics-based dice rolling
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful endpoints under `/api/` prefix
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Session Management**: Express sessions (connect-pg-simple available)

### Data Storage
- **Database**: PostgreSQL (configured via DATABASE_URL environment variable)
- **Schema Location**: `shared/schema.ts` - shared between client and server
- **Migrations**: Drizzle Kit with `drizzle-kit push` for schema sync

### Key Data Models
- **GameSession**: Tracks player health, gold, score, stage progression, combat state, dice state, and inventory (jokers, consumables, vouchers) stored as JSONB

### Application Flow
1. **HomePage**: New game creation via POST `/api/games/new`
2. **GameScreen**: Combat with 3D dice rolling, hand evaluation, enemy damage
3. **ShopPage**: Purchase items between rounds
4. **StageSelectPage**: Choose difficulty for next encounter

### Build System
- Client builds to `dist/public` via Vite
- Server bundles with esbuild to `dist/index.cjs`
- Shared code in `shared/` directory accessible to both client and server

## External Dependencies

### Database
- PostgreSQL database required (provisioned via Replit or external)
- Connection string via `DATABASE_URL` environment variable

### Third-Party Libraries
- **UI Components**: Full shadcn/ui component suite with Radix UI primitives
- **3D Graphics**: Three.js ecosystem (react-three-fiber, drei, cannon)
- **Form Handling**: React Hook Form with Zod validation
- **Date Utilities**: date-fns

### Replit Integration
- Custom Vite plugins for development banners and cartographer
- Runtime error overlay modal
- Meta images plugin for OpenGraph tags