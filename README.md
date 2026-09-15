# Project HAZE Admin

React + TypeScript admin panel for **Project HAZE** (Node/Express APIs).

Naming follows the same pattern as `gas-on-the-go-admin` → **`Project-HAZE-ADMIN`** (pairs with `Project-HAZE-BACKEND`).

## Features (this milestone)

- Admin login (`POST /admin/login`)
- Remember me (localStorage vs sessionStorage)
- Forgot password (3-step OTP: email → OTP → set password)
- Main dashboard (pending businesses / blogs / ads / contributions)
- Logout (`PATCH /auth/logout`)

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

Default API: `https://project-haze-backend.deployment-uat.com`

## Auth notes

Admin must exist in Mongo with `role: "admin"` and a password set (via forgot-password flow if needed).
UAT forgot-password returns OTP in the API response for testing.
