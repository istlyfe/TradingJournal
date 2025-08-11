# Trading Journal

A web application for traders to track, analyze, and improve their trading performance.

## Features

- Import trades from CSV files (supports multiple platforms)
- Track and visualize trading performance
- Analyze profit/loss by symbol, strategy, and time
- Calendar view of trading activity
- Journal entries for trading insights
- Responsive design for desktop and mobile

## Tech Stack

- Next.js 14
- React
- TypeScript
- TailwindCSS
- Shadcn UI
- Local storage for data persistence

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Deployment

This project is configured for deployment on Vercel:

```bash
# Deploy with Vercel CLI
vercel

## Environment

Create a `.env` file with your database connection and secrets:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME?schema=public
JWT_SECRET=change_me
NEXTAUTH_SECRET=change_me
```

During Vercel builds, migrations are applied automatically via the build script.
``` 