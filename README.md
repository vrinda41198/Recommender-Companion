# Recommender Companion

## Prerequisites

- Docker
- Docker Compose

## Quick Start

1. Clone the repository
2. Start the application:
```bash
docker-compose up --build
```

The application will be available at http://localhost:5000

## API Endpoints

- `GET /health`: Health check endpoint
- `POST /login`: Simple login endpoint (returns 200 OK)

## Development

1. Make changes to the code
2. The Flask development server will automatically reload
3. Database tables are automatically created on startup

## Environment Variables

Set in `.env` file:
- `FLASK_APP`: Flask application entry point
- `FLASK_ENV`: Development environment
- `DATABASE_URL`: MySQL connection string
- `MYSQL_*`: MySQL configuration

## Container Management

```bash
# Start containers
docker-compose up

# Stop containers
docker-compose down

# View logs
docker-compose logs

# Access MySQL shell
docker-compose exec db mysql -uuser -ppassword rc_db
```