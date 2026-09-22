# Monorepo for mobile app and API

CatOps ships an Expo mobile app and a Next.js API that share domain types (User, Household, Feline, Event, Inventory) end to end. We considered separate repos per app but chose a single monorepo (`apps/mobile`, `apps/api`, `packages/shared`) so the Mongoose schema and the app's TypeScript types change together in one commit instead of drifting across repos and package-version bumps. Splitting the monorepo later, if it's ever needed, is cheap; merging two already-diverged repos back together is not — so we're erring toward the more reversible starting point.
