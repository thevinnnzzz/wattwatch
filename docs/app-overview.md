# WattWatch — App Overview

WattWatch is a mobile energy monitoring application built with **Expo (React Native)** and **Supabase**. It helps users track appliance energy consumption, estimate costs, set budgets, and receive alerts when approaching or exceeding spending limits.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | **Expo SDK 57** + **React Native 0.86** |
| Language | **TypeScript** |
| Routing | **Expo Router** (file-based) |
| State (server) | **TanStack React Query** |
| State (client) | **Zustand** |
| Backend | **Supabase** (Auth, PostgreSQL, Edge Functions, Realtime) |
| Forms | **react-hook-form** + **Zod** |
| Styling | **NativeWind** (Tailwind CSS) + **StyleSheet** |
| Charts | Custom **react-native-svg** (bar/pie charts) |
| Icons | **@expo/vector-icons** (Ionicons) |
| Gestures | **react-native-gesture-handler** |
| Notifications | **expo-notifications** + Supabase Edge Functions |
| Auth | **Supabase Auth** (email/password, implicit flow) |

---

## Project Structure

```
├── app/                    # Expo Router pages
│   ├── _layout.tsx         # Root layout (providers, auth gate, splash)
│   ├── (auth)/             # Login, register, forgot/reset password
│   │   ├── index.tsx       # Login
│   │   ├── register.tsx    # Registration
│   │   ├── forgot-password.tsx
│   │   ├── update-password.tsx
│   │   └── verify.tsx
│   └── (app)/              # Main app (tab navigator)
│       ├── index.tsx       # Dashboard (home)
│       ├── analytics.tsx   # Energy analytics (charts)
│       ├── appliances.tsx  # Appliance list CRUD
│       ├── profile.tsx     # Profile, budget, logout
│       ├── add-appliance.tsx
│       ├── appliance-details.tsx
│       ├── notifications.tsx
│       ├── admin.tsx
│       └── about.tsx
├── src/
│   ├── components/         # Reusable UI, forms, layouts
│   ├── constants/          # Theme palette, spacing, typography
│   ├── hooks/              # useAuth, useSupabaseQuery, useNotifications
│   ├── lib/                # supabase client, query-client, energy calculations
│   ├── services/           # API service layer (auth, appliance, energy, etc.)
│   ├── store/              # Zustand stores
│   └── validations/        # Zod schemas
├── supabase/
│   ├── migrations/         # Database migrations
│   └── functions/          # Edge Functions (push notifications)
└── docs/
    ├── app-overview.md
    └── admin-setup.md
```

---

## Core Functionality

### Dashboard
- Greeting with user name, notification badge
- "This Month's Usage" card: total kWh, estimated cost, current rate, budget progress bar
- **Top Consumers** tab: ranked appliances by cost contribution
- **Energy Tips** tab: personalized tips based on appliance data
- Budget alerts: when spending approaches or exceeds the monthly limit, an alert is shown and a push notification is sent

### Appliances
- **List** (with swipe-to-delete, long-press action menu, filter/sort)
- **Add** via searchable catalog (~60+ common appliances) or manual form
- **Edit** details (name, wattage, hours used daily)
- **Toggle active/inactive** — inactive appliances excluded from dashboard & analytics
- **Auto-log generation** — new appliances get 30 days of simulated energy logs

### Analytics
- Granularity: Daily, Weekly, Monthly, Yearly
- Dual-axis bar+line chart (kWh vs cost)
- Pie chart (consumption breakdown by appliance)
- Period comparison (first half vs second half)
- Filterable by appliance, category, metric (kWh/cost), date range
- Summary cards: total consumption/cost, daily average, peak day
- "Generate Data" button (admin-only toggle) for testing

### Profile & Budget
- Edit display name
- Monthly budget limit + alert threshold percentage
- Budget changes trigger re-evaluation of alerts
- Logout

### Admin Panel (role-gated)
- Update the electricity rate (PHP/kWh)
- Toggle demo data generation for all users
- Accessible only to users with `role = 'admin'` in the `profiles` table

---

## Database

**Supabase project:** `eqgvhedzrabdtrmttbcx.supabase.co`

Key tables: `profiles`, `appliances`, `energy_logs`, `budgets`, `rate_plans`, `notifications`, `admin_config`, `accounts`, `bills`, `payments`, `tickets`, `announcements`.

- New users get a profile auto-created via a DB trigger on `auth.users`
- RLS policies restrict data to the owning user
- Demo energy logs are generated on appliance creation for immediate feedback

---

## Energy Calculation Model

```
kWh = (wattage × hours_used) / 1000
cost = kWh × current_rate_per_kwh
```

- Costs are computed at query time using the active rate (default: 12.45 PHP/kWh)
- Changing the rate retroactively updates all historical cost displays
- Demo logs include realistic daily variation (0.7×–1.3×) with weekend adjustment (0.7×)

---

## Running Locally

### Prerequisites
- **Node.js** >= 18
- **npm** or **yarn**
- **Expo CLI** (`npm install -g expo-cli`) or **EAS CLI** (`npm install -g eas-cli`)
- **Android Studio** (for Android emulator) or **Xcode** (for iOS simulator)
- **Expo Go** app on your device (optional, for testing)

### Setup

```bash
# 1. Clone or navigate to the project
cd Meralco-clone

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env.local
```

Edit `.env.local` and fill in your Supabase credentials:

```
EXPO_PUBLIC_SUPABASE_URL=https://eqgvhedzrabdtrmttbcx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
EXPO_PUBLIC_EAS_PROJECT_ID=<your-eas-project-id>
```

### Start Development

```bash
# Start Expo dev server
npx expo start
```

- Scan QR code with **Expo Go** on your phone
- Press `a` for Android emulator / `i` for iOS simulator

### Run on Device (Development Build)

```bash
# Build a development client and install on device
npx expo run:android
# or
npx expo run:ios
```

---

## Building a Shareable APK

An **APK** (Android Package) can be shared and installed on any Android device without going through the Play Store.

### One command (using EAS Build):

```bash
npx eas build -p android --profile preview
```

The `preview` profile in `eas.json` is already configured to output an APK:

```json
"preview": {
  "distribution": "internal",
  "android": {
    "buildType": "apk"
  }
}
```

- The build runs on **Expo's cloud servers** (no local build required)
- When finished, it prints a download URL and install instructions
- You can also manage builds at [expo.dev](https://expo.dev)

### What to expect

| Artifact | Profile | Use |
|----------|---------|-----|
| **APK** | `preview` | Share directly, install on any Android device |
| **AAB** | `production` | Play Store release (auto-increments version) |
| **Dev Client** | `development` | Development with dev tools |

### Notes
- The APK will use the Supabase project credentials from your EAS environment secrets (set via `eas secret:create`)
- Ensure `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are configured as EAS secrets for cloud builds
- For the password reset flow to work, add the app's redirect URL to **Supabase Dashboard → Authentication → Settings → Redirect URLs**:
  - For production APK: `wattwatch://update-password`
  - For Expo Go: the `exp://...` URL shown in the terminal when running `npx expo start`

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `EXPO_PUBLIC_EAS_PROJECT_ID` | EAS project ID (for OTA updates) |
| `APP_NAME` | App display name |

---

## Key Commands

```bash
npm start              # Start Expo dev server
npx expo start         # Start Expo dev server
npx expo run:android   # Build & run on Android device/emulator
npx expo run:ios       # Build & run on iOS simulator
npx eas build -p android --profile preview   # Build shareable APK
npx eas build -p android --profile production # Build Play Store AAB
npx eas build -p ios                           # Build iOS IPA
npx expo lint          # Run ESLint
```

---

## Admin Setup

See [admin-setup.md](./admin-setup.md) for instructions on granting admin privileges.
