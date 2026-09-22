# Product Requirements Document: "CatOps" 

## 1. Executive Summary
**CatOps** is a centralized logistics and household management app for cat owners. It replaces ad-hoc calendars and mental math by providing a structured system for tracking vet visits, managing recurring grooming/daycare schedules, and monitoring supply inventory (food, litter, medication). 

## 2. Target Audience
*   **Primary:** Single- or multi-cat households needing structured oversight of pet responsibilities.
*   **Secondary:** Shared households (partners/roommates) who need to split cat-care duties without communication bottlenecks.

## 3. Core Tech Stack
*   **Frontend:** React Native (Expo), TypeScript, React Navigation.
*   **Backend:** Next.js (API Routes), MongoDB Atlas (Mongoose/Prisma).
*   **Infrastructure:** Resend (Email OTP / Auth), Upstash (Redis caching for recurring jobs).
*   **State Management:** Zustand or React Query.

## 4. Domain Model & Taxonomy
To successfully scaffold the backend and local state, the AI should understand these core entities:

*   **`User`**: Account owner (email, preferences).
*   **`Household`**: A shared workspace for users to collaborate on cat logistics.
*   **`Feline`**: The cat profile (name, DOB, breed, target weight, dietary restrictions).
*   **`Event`**: Time-bound activities (type: `VET`, `GROOMING`, `DAYCARE`). Contains date, location, provider details, and recurrence rules.
*   **`Inventory`**: Consumable supplies (type: `FOOD`, `LITTER`, `MEDS`). Contains current stock level, daily consumption rate, and reorder threshold.

## 5. Key Features & Acceptance Criteria

### 5.1. Authentication & Onboarding
*   **Flow:** Social SSO (Apple/Google) and Email OTP (via Resend).
*   **AC1:** User can log in without a password.
*   **AC2:** Post-login, user is prompted to create their first `Feline` profile.

### 5.2. Dashboard & Upcoming Tasks
*   **Flow:** A chronologically sorted feed of upcoming events and critical alerts (e.g., "Low on Litter").
*   **AC1:** UI displays the next 7 days of scheduled events.
*   **AC2:** Highlights inventory items that have crossed below their reorder threshold.

### 5.3. Inventory Management (The "Pantry")
*   **Flow:** A CRUD interface for tracking cat supplies.
*   **AC1:** User can add an item, define the total amount (e.g., 5kg bag of food), and set a daily burn rate (e.g., 100g/day).
*   **AC2:** System calculates estimated depletion date and triggers a warning 3 days prior.

### 5.4. Logistics & Scheduling
*   **Flow:** Calendar integration for external appointments.
*   **AC1:** User can log a past vet visit and attach notes (text/image of receipt).
*   **AC2:** User can set a recurring rule for grooming (e.g., every 6 weeks) which auto-populates the dashboard.

## 6. UI Architecture & Navigation (Bottom Tabs)
1.  **Home:** Timeline dashboard, immediate action items, and inventory alerts.
2.  **Cats:** Profiles of the cats, weight tracking, and medical history.
3.  **Pantry:** Inventory lists, burn rates, and restock toggles.
4.  **Settings:** Household sharing, notifications, and auth management.


