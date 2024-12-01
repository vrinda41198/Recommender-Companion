# Recommender Companion

## Prerequisites

- Docker Desktop
- Python 3.8 or higher

## Quick Start

1. Clone the repository
2. Get the Microsoft Azure credentials:
   - Tenant ID
   - Client ID
   - Client Secret
3. Start the application using the provided script:
```bash
# Windows
python start.py <tenant_id> <client_id> <client_secret>

# Linux/MacOS
python3 start.py <tenant_id> <client_id> <client_secret>
```

For help with the startup script:
```bash
python start.py --help
```

The application will be available at http://localhost:5000


## API Endpoints

- `GET /api/health`: Health check endpoint
- `GET /api/auth/login`: Initiate Microsoft OAuth login
- `POST /api/auth/callback`: Handle OAuth callback
- `GET /api/auth/user`: Get current user information
- `GET /api/auth/logout`: Logout user
- `GET /api/listings`: Get movies and books
- `POST /api/movies`: Add new movie (admin only)
- `POST /api/books`: Add new book (admin only)

## Database Migrations

Database migrations are handled by Flyway and run automatically on startup. To add new migrations:

1. Create SQL files in `sql/` directory
2. Name them using the pattern: `V{number}__{description}.sql`
   Example: `V1__create_users_table.sql`

## Development

1. Make changes to the code
2. The Flask development server will automatically reload
3. For database changes, add new migration files in `sql/` directory

## Security Notes

1. Keep the Microsoft credentials secure
2. Regularly rotate your client secret
3. Use appropriate access controls in Azure AD

## Container Management

```bash
# Start containers with credentials
python start.py <tenant_id> <client_id> <client_secret>

# Stop containers and remove volumes
docker-compose down -v

# View logs
docker-compose logs

# Access MySQL shell
docker-compose exec db mysql -uuser -ppassword rc_db
```