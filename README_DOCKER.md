# Docker Setup Guide

This application is now fully dockerized. You can run all 11+ services with a single command. This works on Mac, Linux, and Windows.

## Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

## Running the Application

1.  **Clone the repository** (if you haven't already).
2.  **Navigate to the project root**:
    ```bash
    cd "Updated_Code_SeatSelection 3"
    ```
3.  **Start all services**:
    ```bash
    docker-compose up --build
    ```
    *Note: The first build will take a few minutes as it downloads base images and installs dependencies.*

4.  **Access the application**:
    - **Frontend**: [http://localhost](http://localhost) (Port 80)
    - **API Gateway**: [http://localhost:4000](http://localhost:4000)

## Database Seeding
After the services are up, you need to seed the database with flights and seats.

```bash
# Run the seed script inside the auth-service container
docker-compose exec auth-service node ../seeding_standalone.js
```
*(Note: I have provided a fixed `src/seed.js` for container compatibility)*

## Troubleshooting
- **Logs**: View logs for all services: `docker-compose logs -f`
- **Specific Service Logs**: `docker-compose logs -f flight-service`
- **Restarting**: `docker-compose restart <service-name>`
- **Downing**: `docker-compose down -v` (The `-v` removes volumes/database data)

## Port Mapping
| Service | Internal Port | External Port |
| :--- | :--- | :--- |
| Frontend | 80 | 80 |
| API Gateway | 4000 | 4000 |
| MySQL | 3306 | 3306 |
| Redis | 6379 | 6379 |
| MongoDB | 27017 | 27017 |
