# MemeVerse (@MemeVerseDC)

## Overview

MemeVerse is a social media-inspired meme showcase and community platform. It's a single-page application that displays curated memes, allows category filtering, shows community testimonials, and includes a contact form for meme idea submissions. The project follows a meme/entertainment theme with a playful, vibrant design inspired by Instagram and TikTok.

## User Preferences

Preferred communication style: Simple, everyday language.

**IMPORTANT - Mobile-First Design**: The web app is primarily designed for mobile/smartphone use. All pages and components MUST be optimized for mobile viewing first, then adapted for larger screens. Mobile experience is the priority.

**Design Principles**:
- Mobile-first responsive design
- Touch-friendly buttons and controls (minimum 44px touch targets)
- No TikTok/Instagram clone - create unique MemeVerse identity
- Clean, modern card-based layouts
- No emoji characters - use Lucide icons only

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with CSS variables for theming
- **UI Components**: Shadcn/ui component library (New York style variant)
- **Build Tool**: Vite with hot module replacement

The frontend follows a component-based architecture with pages in `client/src/pages/` and reusable components in `client/src/components/`. UI primitives from Shadcn are in `client/src/components/ui/`.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Server**: HTTP server with Vite middleware for development
- **API Style**: RESTful JSON API endpoints under `/api/*`

The server serves both the API and the static frontend build. In development, Vite handles the frontend with HMR. In production, static files are served from `dist/public`.

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Current Implementation**: In-memory storage (`MemStorage` class) with sample data
- **Database Ready**: Schema defined for users, memes, categories, and contact submissions

The storage layer uses an interface pattern (`IStorage`) allowing easy swap between in-memory and database implementations.

### Design Patterns
- **Shared Types**: Schema and types in `shared/` directory accessible to both client and server via path aliases
- **Path Aliases**: `@/` for client source, `@shared/` for shared code, `@assets/` for attached assets
- **Theme System**: Dark/light mode with CSS variables and a ThemeProvider context
- **Form Validation**: Zod schemas generated from Drizzle schemas using drizzle-zod

## External Dependencies

### Database
- **PostgreSQL**: Required for production (DATABASE_URL environment variable)
- **Drizzle Kit**: Database migrations stored in `migrations/` directory
- **Schema Push**: Use `npm run db:push` to sync schema to database

### UI/Component Libraries
- **Radix UI**: Headless component primitives (dialogs, dropdowns, etc.)
- **Lucide React**: Icon library
- **Embla Carousel**: Carousel functionality
- **React Day Picker**: Calendar component

### Fonts (External)
- **Google Fonts**: Poppins (primary) and Inter (secondary) loaded via CDN

### Build & Development
- **esbuild**: Server bundling for production
- **Replit Plugins**: Dev banner, cartographer, and runtime error overlay for Replit environment