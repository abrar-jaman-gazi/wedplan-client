# WedPlan — Frontend

WedPlan is a wedding planning platform that helps customers discover wedding services, manage bookings, and coordinate wedding-related needs. Vendors can manage their service listings and subscription, while administrators can manage platform activity.

This repository contains the **frontend application** built with Next.js and React.

## Live Application

- **Backend API:** https://wedplan-server-q9x4.onrender.com

## Technology Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Better Auth client
- Lucide React
- Motion

## Main Features

### Public and Authentication

- Public landing page and service discovery
- Customer and vendor registration flows
- Email and password authentication
- Google authentication through the backend Better Auth configuration
- Responsive navigation and layouts

### Customer

- Customer dashboard
- Browse wedding services and view service details
- Manage customer profile
- Create and view bookings
- View booking status

### Vendor

- Vendor dashboard
- Manage service listings
- View and manage bookings
- Manage subscription
- Start a Stripe Checkout subscription flow

### Administrator

- Admin dashboard and platform statistics
- User management
- Service management and approval workflows
- Transaction history, including available masked payment-card details

## Project Structure

```text
wedplan-client/
├── app/
│   ├── admin/
│   │   ├── dashboard/
│   │   └── transactions/
│   ├── auth/redirect/
│   ├── customer/
│   ├── profile/
│   ├── services/
│   ├── sign-in/
│   ├── sign-up/
│   ├── vendor/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── auth-client.ts
│   └── upload-image.ts
├── public/
├── package.json
└── README.md
```

## Requirements

- Node.js (use a current LTS release)
- npm
- Access to the WedPlan backend API for authentication and server-backed features

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/abrar-jaman-gazi/wedplan-client.git
cd wedplan-client
npm install
```

## Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
NEXT_PUBLIC_AUTH_URL=http://localhost:5001/api/auth
```

For production, set these variables in the frontend hosting provider to the deployed backend URLs. For example:

```env
NEXT_PUBLIC_API_URL=https://wedplan-server-q9x4.onrender.com/api
NEXT_PUBLIC_AUTH_URL=https://wedplan-server-q9x4.onrender.com/api/auth
```

`NEXT_PUBLIC_` variables are included in the browser bundle. Do not put private keys, database credentials, Stripe secret keys, OAuth client secrets, or other server secrets in this file.

## Run Locally

Start the development server:

```bash
npm run dev
```

Open http://localhost:3000.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the local development server |
| `npm run build` | Create a production build |
| `npm run start` | Run the production build locally |
| `npm run lint` | Run ESLint |

## Production Deployment

The frontend can be deployed to Vercel or another Next.js-compatible hosting platform.

1. Push the frontend changes to the connected GitHub branch.
2. Configure `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_AUTH_URL` in the hosting dashboard.
3. Trigger a deployment or wait for the Git-connected deployment to complete.
4. Verify authentication, service discovery, booking flows, vendor subscription checkout, and admin pages on the deployed site.

## Related Repository

- **Backend:** https://github.com/abrar-jaman-gazi/wedplan-server

## Security Notes

- Never commit `.env.local` or other files containing secrets.
- Never expose Stripe secret keys, Stripe webhook signing secrets, MongoDB connection strings, Better Auth secrets, or Google OAuth client secrets in frontend code.
- Payment card information displayed by the application should remain masked; do not store or expose full card numbers or CVC values.

## Project Status

The frontend includes customer, vendor, and administrator areas and integrates with the WedPlan backend for authentication, bookings, services, uploads, and subscription-related workflows.
