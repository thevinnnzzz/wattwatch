# WattWatch — Smart Energy Consumption Tracker

WattWatch is a cross-platform mobile app (Android / iOS / Web) that helps users monitor and manage their household electricity consumption. Built with **Expo SDK 57** and **React Native 0.86**, it connects to a **Supabase** backend for authentication, real-time data storage, and push notifications.

---

## Core Functionalities

- **Dashboard** — See your total monthly kWh consumption, estimated cost (calculated live from the current Meralco rate), and top energy-consuming appliances.
- **Appliance Management** — Add, edit, or remove appliances with name, wattage, and daily usage hours. Toggle appliances on/off to exclude them from calculations.
- **Energy Analytics** — Historical charts and breakdowns of consumption over time.
- **Budget Alerts** — Set a monthly budget and alert threshold. The app checks spending on every refresh and sends a local notification + persistent in-app notification when you approach or exceed your limit.
- **Notifications** — In-app notification list with read/unread tracking and a "Clear All" button to delete notification history from the database.
- **Rate Management (Admin)** — Administrators can update the Meralco rate per kWh and toggle demo data generation.
- **Authentication** — Full sign-up, login, password reset, and email verification flow via Supabase Auth.
- **Push Notifications** — Device-level push notifications using Expo Notifications (configured via Supabase Edge Functions).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/) |
| UI | React Native 0.86 + [NativeWind](https://www.nativewind.dev/) (Tailwind CSS) |
| Navigation | [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing) |
| Forms | React Hook Form + Zod validation |
| State / Server State | Zustand + TanStack React Query v5 |
| Backend | Supabase (Auth, Postgres DB, Edge Functions) |
| Notifications | Expo Notifications + Supabase Edge Functions |
| Charts | *(optional – analytics screen)* |
| Build | EAS Build (development / preview APK / production) |

---

## Prerequisites

- **Node.js** >= 18.x (LTS recommended)
- **npm** >= 9.x (or your preferred package manager)
- **Expo CLI** — `npm install -g expo-cli`
- **EAS CLI** (for building APKs) — `npm install -g eas-cli`
- A **Supabase** project (see [Backend Setup](#backend-setup))
- An **Expo** account — sign up at https://expo.dev

---

## Installation & Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd Meralco-clone

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local   # (create from example; see below)
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase — get these from your Supabase project dashboard
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Expo — for push notifications
EXPO_PROJECT_ID=your-expo-project-id
```

> **Note:** Expo publicly-scoped environment variables must be prefixed with `EXPO_PUBLIC_`. The `.env*.local` files are gitignored and will not be committed.

---

## Backend Setup (Supabase)

1. Create a project at [supabase.com](https://supabase.com).
2. Run the migration files located in `supabase/migrations/` against your Supabase database, in order:
   - `001_initial_schema.sql` — core tables (profiles, appliances, energy_logs, budgets, rate_plans, notifications)
   - `002_add_push_token.sql` — push notification token support
   - `003_add_admin.sql` — admin role support
   - `004_add_is_demo.sql` — demo data flag for energy logs
   - `005_add_appliance_icons.sql` — appliance icon support
3. Deploy the Edge Functions in `supabase/functions/`:
   - `check-usage-alerts/` — periodic budget alert checking
   - `send-notification/` — send push notifications via Expo
4. Copy your Supabase project URL and anon key into `.env.local`.

### Admin Setup

To grant admin privileges to a user, run the following SQL in the Supabase SQL editor:

```sql
-- List existing profiles
SELECT id, email, full_name, role FROM profiles;

-- Set a user's role to admin (replace the user ID)
UPDATE profiles SET role = 'admin' WHERE id = 'user-uuid-here';
```

Admin features: update the Meralco rate per kWh, and toggle demo data generation.

---

## Running the App

### Development (local)

```bash
# Start the Expo dev server
npx expo start
```

- Scan the QR code with **Expo Go** on your phone, or
- Press `a` for Android emulator / `i` for iOS simulator / `w` for web browser.

### Web

```bash
npx expo start --web
```

### Lint

```bash
npm run lint
```

---

## Building an APK

Use **EAS Build** to generate a standalone APK:

```bash
# 1. Log in to your Expo account
eas login

# 2. Build a preview APK (internal distribution)
eas build --platform android --profile preview
```

The `preview` profile in `eas.json` produces an APK (rather than AAB). You will receive a download URL once the build completes.

**Build profiles** (defined in `eas.json`):

| Profile | Use Case |
|---|---|
| `development` | Dev client with Expo Dev Menu |
| `preview` | Internal testing APK |
| `production` | Store-ready AAB (auto-increment version) |

For a local build (requires Android SDK):

```bash
eas build --platform android --profile preview --local
```

---

## Project Structure

```
.
├── app/                          # Expo Router file-based screens
│   ├── _layout.tsx               # Root layout (providers, auth gate)
│   ├── (app)/                    # Authenticated screens (tab navigator)
│   │   ├── index.tsx             # Dashboard
│   │   ├── analytics.tsx         # Energy analytics
│   │   ├── appliances.tsx        # Appliance list
│   │   ├── add-appliance.tsx     # Add/edit appliance
│   │   ├── appliance-details.tsx # Single appliance detail
│   │   ├── notifications.tsx     # Notification inbox
│   │   ├── profile.tsx           # User profile & budget settings
│   │   ├── admin.tsx             # Admin panel
│   │   └── about.tsx             # About screen
│   ├── (auth)/                   # Unauthenticated screens
│   │   ├── index.tsx             # Login
│   │   ├── register.tsx          # Registration
│   │   ├── forgot-password.tsx   # Password reset
│   │   ├── update-password.tsx   # Set new password
│   │   └── verify.tsx            # Email verification
│   └── +not-found.tsx            # 404 fallback
├── src/
│   ├── components/               # Reusable components
│   │   ├── ui/                   # Generic UI primitives (Button, Card, Input, etc.)
│   │   ├── forms/                # Form components (FormField, FormSelect, etc.)
│   │   ├── layout/               # Layout helpers (ScreenHeader, TabBarIcon, etc.)
│   │   ├── energy/               # Energy-specific components
│   │   ├── providers/            # React context providers
│   │   └── ...                   # Other components
│   ├── constants/                # Colors, spacing, theme palette
│   ├── hooks/                    # Custom React hooks
│   │   ├── useAuth.ts            # Authentication (login, logout, profile)
│   │   ├── useSupabaseQuery.ts   # React Query hooks for all Supabase entities
│   │   └── useNotifications.ts   # Push/local notification helpers
│   ├── lib/                      # Utilities & clients
│   │   ├── supabase.ts           # Supabase client
│   │   ├── query-client.ts       # TanStack Query config & key factories
│   │   └── energyCalculations.ts # Energy math helpers
│   ├── services/                 # API service layer (Supabase queries)
│   ├── store/                    # Zustand state stores
│   ├── types/                    # TypeScript type definitions
│   └── validations/              # Zod validation schemas
├── assets/                       # Images, fonts, icons
├── supabase/                     # Backend migrations & edge functions
├── app.json                      # Expo config
├── eas.json                      # EAS Build config
├── tailwind.config.js            # Tailwind / NativeWind theme
└── tsconfig.json                 # TypeScript config
```

---

## Key Screens

| Route | Screen | Description |
|---|---|---|
| `/(app)/` | Dashboard | Monthly consumption summary, cost, top consumers, budget progress |
| `/(app)/appliances` | Appliances | CRUD list of appliances with sort/filter, toggle active state |
| `/(app)/add-appliance` | Add Appliance | Form to add a new appliance with catalog presets |
| `/(app)/analytics` | Analytics | Historical energy usage charts |
| `/(app)/notifications` | Notifications | In-app notification list with mark-read and clear-all |
| `/(app)/profile` | Profile | Edit name, monthly budget, alert threshold; logout |
| `/(app)/admin` | Admin Panel | Update Meralco rate, toggle demo data (admin only) |
| `/(auth)/` | Login | Sign in with email/password |
| `/(auth)/register` | Register | Create a new account |

---

## Cost Calculation Model

Energy costs are computed at query time rather than stored statically:

```
cost = kwh_consumed × current_rate
```

- `kwh_consumed` is pulled from `energy_logs`
- `current_rate` is fetched from the active `rate_plans` row
- Dashboard, analytics, and budget alerts all derive cost the same way, so changing the rate retroactively updates every screen.

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
