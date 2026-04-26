# Alumni Tracker Backend

This is the backend service for the Alumni Tracker application. It provides APIs for managing alumni data and performing automated tracking using web scraping techniques.

## Features

- **Alumni Management**: CRUD operations for alumni data.
- **Automated Tracking**: Uses Playwright and custom scrapers to track alumni progress across various platforms (LinkedIn, Instagram, Facebook, TikTok).
- **Search Integration**: Integrated search services (DuckDuckGo, Google) for finding alumni information.
- **Dockerized**: Easy deployment using Docker and Docker Compose.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **ORM**: Sequelize
- **Database**: MySQL
- **Scraping**: Playwright, Cheerio
- **Containerization**: Docker

## Prerequisites

- Node.js (v18 or higher recommended)
- MySQL Database
- Docker (optional, for containerized deployment)

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd backend_js2
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Create a `.env` file in the root directory and configure the following variables:
   ```env
   PORT=8005
   DB_NAME=your_db_name
   DB_USER=your_db_user
   DB_PASS=your_db_password
   DB_HOST=localhost
   ```

4. **Run the application**:
   - Development mode:
     ```bash
     npm run dev
     ```
   - Production mode:
     ```bash
     npm start
     ```

## Docker Usage

### Build and Run with Docker

1. **Build the image**:
   ```bash
   docker build -t alumni-tracker-backend .
   ```

2. **Run the container**:
   ```bash
   docker run -p 8005:8005 --env-file .env alumni-tracker-backend
   ```

## API Endpoints

### Tracking
- `GET /all-alumni`: Get all alumni records.
- `GET /all-tracked`: Get all tracked data.
- `GET /track/:target_id`: Run tracking for a specific alumni ID.
- `POST /track-all`: Run tracking for all alumni.

### Admin
- `GET /admin/all`: Get all admin users.
- `POST /admin/login`: Admin login.

### Search
- `GET /search`: Perform a search.

## Project Structure

- `src/controllers`: Request handlers.
- `src/models`: Sequelize models.
- `src/routes`: API route definitions.
- `src/services`: Business logic and scraping services.
- `src/db.js`: Database configuration.
- `src/server.js`: Application entry point.
