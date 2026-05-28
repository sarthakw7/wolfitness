# Wolfitness Mobile Integration Guide

This document defines how `wolfitness-expo` (mobile) should integrate with `wolfitness` (web/backend).

## Integration Model

- `wolfitness` web is the server source of truth.
- `wolfitness-expo` consumes server APIs and Supabase data.
- Mobile must not bypass server-verified flows (purchase, AI auth context, etc.).

## Base URL Rules

### Local development (physical device)

Use your Mac LAN IP (not localhost):

```env
EXPO_PUBLIC_API_URL=http://192.168.x.xxx:3000
```

### Remote testers / preview builds

Use deployed web domain:

```env
EXPO_PUBLIC_API_URL=https://your-web-domain.com
```

Never use:
- `http://localhost:3000`
- `http://127.0.0.1:3000`
- local LAN IP for remote testers

## Required Expo Environment Variables

In `wolfitness-expo/.env` (local) or EAS secrets (remote builds):

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_API_URL=
```

## API Auth Contract

For protected web API routes, Expo sends bearer auth:

- `Authorization: Bearer <supabase_access_token>`

Backend validates token and resolves athlete context server-side.

## Endpoints Mobile Should Use

Examples:

- `/api/ai/nutrition/estimate`
- `/api/ai/nutrition/coach`
- `/api/ai/nutrition/chat`
- `/api/purchase/init`

Any sensitive logic should remain server-side (context joins, Stripe verification, entitlement checks).

## Purchases and Access

- Mobile should not grant paid access optimistically.
- Access unlock only after verified server purchase state and enrollment update.
- Webhook fulfillment remains source of truth.

## EAS Build Setup (Remote APK Testing)

1. Set EAS secrets:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value <value>
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value <value>
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value https://your-web-domain.com
```

2. Build preview APK:

```bash
eas build -p android --profile preview
```

3. Share EAS install link with testers.

## Common Failure Cases

- API URL points to localhost/LAN in remote build.
- Supabase keys missing in EAS environment.
- Web backend deployed but API route auth/env mismatched.
- Stripe/webhook events not reflected in enrollment state yet.

## Quick Verification Checklist

After installing mobile build:

1. Login works
2. Dashboard loads
3. AI nutrition endpoint responds
4. Marketplace gating matches purchase ownership
5. Program/workout access respects server enrollment state

