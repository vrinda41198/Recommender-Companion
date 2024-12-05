# Recommender Companion

## Introduction
Recommender Companion is a web application designed to provide personalized book and movie recommendations based on user preferences. Utilizing Microsoft OAuth for authentication, Docker for consistent environment setup, and Flyway for database migrations, the application ensures a robust and secure user experience.

## Installation

### Prerequisites
- Docker Desktop
- Python 3.8 or higher
- Node.js
- Angular CLI

### Dependencies
To install the necessary Python dependencies, run the following command in your virtual environment:
```bash
pip install -r requirements.txt
```
This will install all required packages such as Flask, SQLAlchemy, and others crucial for the application's backend.

### Backend Setup
1. Clone the repository.
2. Obtain Microsoft Azure credentials:
   - Tenant ID
   - Client ID
   - Client Secret
3. Use the provided startup script to launch the application:
    ```bash
    # Windows
    python start.py <tenant_id> <client_id> <client_secret> <gpt_api_key>

    # Linux/MacOS
    python3 start.py <tenant_id> <client_id> <client_secret> <gpt_api_key>
    ```
   For additional help:
   ```bash
   python start.py --help
   ```
   The application will be available at `http://localhost:5000`.

### Frontend Setup
1. Navigate to the frontend directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Launch the frontend application:
   ```bash
   npm start
   ```
   The frontend will be accessible at `http://localhost:4200/`. Ensure the backend is operational before accessing the frontend.

## Configuration

### Environment Variables
Configure the project using the following environment variables in the `.env` file:
- `MICROSOFT_TENANT_ID`
- `MICROSOFT_CLIENT_ID`
- `MICROSOFT_CLIENT_SECRET`
- `DATABASE_URL`

### Database Setup
The database is structured with five main tables:
- **Movies Table**: Stores data from the TMDB repository.
- **Books Table**: Contains book data from the GoodReads repository.
- **User Table**: Manages information about active users.
- **User Watched Movies Table**: Records movies watched by users.
- **User Read Books Table**: Logs books read by users.

Flyway manages database migrations, which are automatically applied upon service startup.

## API Integration
The `ApiService` and `AdminService` in the Angular frontend handle all interactions with the backend. These services facilitate operations such as fetching listings, submitting reviews, and updating user profiles. Administrative functions include adding new movies or books and retrieving recent additions.

### API Services Description
- **getListings**: Fetches movies or books based on search criteria.
- **submitReview**: Allows users to post reviews.
- **addMovie/book**: Admin functionality to add new content.
- **deleteItem**: Removes a specified item by ID.
- **updateItem**: Updates the details of an item.
- **generateRecommendations**: Offers personalized recommendations.

## Security Measures
- Ensure Microsoft credentials are securely stored and not hard-coded.
- Use HTTPS to protect data in transit.
- Implement appropriate access controls within Azure AD.

## Container Management
Manage Docker containers using the following commands:
```bash
# Start all services
python start.py <tenant_id> <client_id> <client_secret> <gpt_api_keys>

# Stop all services and remove volumes
docker-compose down -v

# View logs for troubleshooting
docker-compose logs

# Access the MySQL shell
docker-compose exec db mysql -uuser -ppassword rc_db
```
