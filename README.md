# Recommender Companion

A Flask application with MySQL database and Flyway migrations running in Docker.

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

## Database Migrations

Database migrations are handled by Flyway and run automatically on startup. To add new migrations:

1. Create SQL files in `sql/` directory
2. Name them using the pattern: `V{number}__{description}.sql`
   Example: `V1__create_users_table.sql`

## Development

1. Make changes to the code
2. The Flask development server will automatically reload
3. For database changes, add new migration files in `sql/` directory

## Environment Variables

Set in `.env` file:
- `FLASK_APP`: Flask application entry point
- `FLASK_ENV`: Development environment
- `FLASK_DEBUG`: Enable debug mode
- `DATABASE_URL`: MySQL connection string
- `MYSQL_ROOT_PASSWORD`: MySQL root password
- `MYSQL_DATABASE`: Database name
- `MYSQL_USER`: Database user
- `MYSQL_PASSWORD`: Database password

## Container Management

```bash
# Start containers
docker-compose up

# Stop containers and remove volumes
docker-compose down -v

# View logs
docker-compose logs

# Access MySQL shell
docker-compose exec db mysql -uuser -ppassword demo_db
```