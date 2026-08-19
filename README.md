# NutriTrack

NutriTrack is a nutrition dashboard built with Next.js, React, Tailwind CSS, Prisma, and PostgreSQL. It helps you log meals and drinks, track calories, protein, carbohydrates, fat, sugar, and sodium, and review seven-day consumption trends.

## Features

- Log food and drinks by meal: breakfast, lunch, dinner, or snack
- Track calories, macronutrients, sugar, and sodium
- View daily progress against calorie, sugar, and sodium targets
- Browse entries by date
- Edit and delete food logs
- Explore seven-day trends for calories, sugar, and sodium
- Store nutrition data in PostgreSQL through Prisma

## Requirements

- Node.js 18.17 or newer
- npm
- PostgreSQL running locally or a reachable PostgreSQL database

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root and set `DATABASE_URL` to your PostgreSQL connection string:

   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/taskflow?schema=public"
   ```

   Replace `USER`, `PASSWORD`, host, port, and database name with your database details.

3. Create or synchronize the database schema:

   ```bash
   npx prisma db push
   ```

   This creates the `FoodLog` table and the `MealType` enum from `prisma/schema.prisma`.

4. Add sample nutrition entries:

   ```bash
   npx prisma db seed
   ```

   The seed creates breakfast, lunch, and dinner examples for every day in the current month. It is idempotent and skips insertion when the monthly sample data already exists.

5. Start the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run Next.js linting |
| `npx prisma generate` | Generate the Prisma client |
| `npx prisma db push` | Synchronize the database schema |
| `npx prisma db seed` | Add current-month sample data |

## Project Structure

```text
prisma/schema.prisma       Prisma database schema
src/app/actions.ts         Server actions for food log CRUD and trend data
src/app/page.tsx            Server-rendered dashboard entry point
src/components/Dashboard.tsx Main nutrition dashboard and food journal
src/components/ConsumptionChart.tsx Interactive consumption chart
src/lib/db.ts                Prisma client singleton
```

## Database Notes

NutriTrack expects PostgreSQL. When the schema changes, run `npx prisma db push` again to synchronize the database and regenerate the Prisma client. Keep `.env` private because it contains database credentials.
