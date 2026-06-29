# Tubes World Cup Simulator

A World Cup 2026 simulator application with 48 teams, featuring match management and tournament tracking.

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Tubes-World-Cup-Simulator
```

2. Install dependencies:
```bash
npm install
```

## Environment Setup

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit the `.env` file and configure the following variables:
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/world_cup_db?schema=public"
ADMIN_PASSWORD=admin123
JWT_SECRET=worldcup123
```

**Important:** Replace the placeholder values with your actual database credentials and secure passwords.

## Database Setup

1. Make sure your PostgreSQL database is running and the credentials in `.env` are correct.

2. Run Prisma migrations to create the database schema:
```bash
npm run migrate
```

3. Seed the database with initial data (teams and matches):
```bash
npm run seed
```

Alternatively, you can run both migration and seeding in one command:
```bash
npm run build
```

## Running the Application

### Development Mode
For development with auto-reload on file changes:
```bash
npm run dev
```

### Production Mode
To start the server in production mode:
```bash
npm start
```

The server will start on the default port (check `src/index.js` for the exact port configuration).

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start development server with nodemon
- `npm run migrate` - Run Prisma migrations
- `npm run migrate:reset` - Reset database and re-run migrations
- `npm run seed` - Seed the database with initial data
- `npm run studio` - Open Prisma Studio to view/edit database
- `npm run build` - Run migrations and seed database

## Database Management

To open Prisma Studio (a GUI for viewing and editing your database):
```bash
npm run studio
```

This will open a browser window at `http://localhost:5555` where you can view and manage your data.

## Project Structure

```
Tubes-World-Cup-Simulator/
├── prisma/
│   ├── schema.prisma    # Database schema definition
│   ├── seed.js          # Database seeding script
│   └── migrations/      # Database migration files
├── public/
│   ├── index.html       # Frontend HTML
│   ├── script.js        # Frontend JavaScript
│   └── css/             # Stylesheets
├── scripts/             # Utility scripts
├── src/
│   └── index.js         # Main application entry point
├── .env.example         # Example environment variables
├── package.json         # Project dependencies and scripts
└── README.md            # This file
```

## Tech Stack

- **Backend:** Node.js, Express
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT (JSON Web Tokens)
- **Frontend:** HTML, CSS, JavaScript

## Troubleshooting

### Database Connection Issues
If you encounter database connection errors:
- Verify PostgreSQL is running
- Check that the `DATABASE_URL` in `.env` matches your PostgreSQL credentials
- Ensure the database exists in PostgreSQL

### Migration Issues
If migrations fail:
- Run `npm run migrate:reset` to reset the database
- Check that your PostgreSQL database is accessible
- Verify the Prisma schema is valid

## License

This project is licensed under the MIT License.
