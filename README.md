# WanderPlan

WanderPlan is a collaborative trip planning application built with Next.js, Convex, Clerk, and OpenAI.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (React 19)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)
- **Backend & Database**: [Convex](https://convex.dev/)
- **Authentication**: [Clerk](https://clerk.com/)
- **AI Integration**: [OpenAI API](https://openai.com/)

## Prerequisites

Make sure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v20 or newer recommended)
- `npm`, `yarn`, `pnpm`, or `bun`

You will also need accounts for the following services to get the necessary API keys:
- A [Convex](https://convex.dev/) account
- A [Clerk](https://clerk.com/) account
- An [OpenAI](https://openai.com/) account

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd collabtrip
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Environment Variables

Create a `.env.local` file in the root directory based on the `.env.local.example` template:

```bash
cp .env.local.example .env.local
```

Fill in the required environment variables in `.env.local`:

```env
# Convex
# (This will be automatically populated when you run `npx convex dev`)
NEXT_PUBLIC_CONVEX_URL=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret
CLERK_JWT_ISSUER_DOMAIN=your_clerk_jwt_issuer_domain

# Clerk redirect URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# OpenAI
OPENAI_API_KEY=your_openai_api_key
```

### 4. Start the Convex Backend

In a new terminal window, run the Convex development server. This will prompt you to log into Convex, create a new project, and automatically populate your `.env.local` file with the `NEXT_PUBLIC_CONVEX_URL`. It will also sync your Convex functions and schema.

```bash
npx convex dev
```

*Keep this terminal running in the background as you develop.*

### 5. Start the Next.js Development Server

In another terminal window, start the frontend Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to explore the application.

## Project Structure

- `/src/app`: Next.js App Router pages, layouts, and API routes.
- `/src/components`: React components including reusable UI components (shadcn/ui).
- `/convex`: Convex backend functions (queries, mutations, actions) and database schema (`schema.ts`).
- `/public`: Static assets (images, icons, etc.).

## Available Scripts

- `npm run dev`: Starts the Next.js development server.
- `npm run build`: Builds the application for production.
- `npm run start`: Runs the built Next.js application.
- `npm run lint`: Runs ESLint to identify code formatting and style issues.

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com).

1. Push your code to a GitHub repository.
2. Import the project into Vercel.
3. Run `npx convex deploy` to deploy your Convex backend to production.
4. Add your production environment variables to your Vercel project (including the production `NEXT_PUBLIC_CONVEX_URL`, Clerk keys, and OpenAI key).
5. Deploy the application on Vercel.
