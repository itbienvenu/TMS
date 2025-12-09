---
description: Microservices Migration Plan - Advanced
---

# Microservices Migration Phase 1: Infrastructure & Services

This plan converts the Monolith into a fully containerized Microservices architecture.

## Architecture

| Service | Port | Description | DB Name |
| :--- | :--- | :--- | :--- |
| **API Gateway (Nginx)** | 8080 | Routes traffic to services | N/A |
| **Auth Service** | 8001 | Users, Login, Registration | `db_auth` |
| **User Service** | 8002 | User Profiles, Dashboard Stats | `db_user` |
| **Company Service** | 8003 | Companies, Buses, Routes, Drivers | `db_company` |
| **Ticketing Service** | 8004 | Tickets, Booking, Search | `db_ticketing` |
| **QR Service** | 8005 | QR Generation & Verification | `db_qr` |
| **Payment Service** | 8006 | Payments | `db_payment` |

## Infrastructure

-   **Docker Compose**: Orchestrates all services + PostgreSQL + Redis.
-   **PostgreSQL**: Single container, multiple databases (or schemas).
-   **Redis**: For async events (RabbitMQ alternative for simpler setup, or we use RabbitMQ if strictly requested).
-   **Nginx**: Reverse proxy.

## Phase 1: Infrastructure Setup (COMPLETED)
- [x] Create distinct directories for each service (`services/auth`, `services/user`, etc.).
- [x] Set up a `docker-compose.yml` to orchestrate all services + Postgres + Redis.
- [x] Configure NGINX as the API Gateway/Reverse Proxy.
- [x] Establish a shared `common` library for database connections and logging.

## Phase 2: Service Extraction & Migration (COMPLETED)
- [x] **Auth Service**: Migrate login, registration, and JWT issuance logic.
- [x] **User Service**: Migrate user profile and admin management.
- [x] **Company Service**: Migrate company, route, bus, and station management.
- [x] **Ticketing Service**: Migrate ticket booking and checking logic.
- [x] **QR Service**: Migrate QR Code generation and validation.
- [x] **Payment Service**: Migrate payment processing logic.
- [x] **Data Seeding**: Create a script to populate initial data for testing.

## Phase 3: Deployment Preparation (COMPLETED)
- [x] Update Dockerfiles for production readiness.
- [x] Build and Push Docker images to Docker Hub (`bienvenugashema/...`).

## Status: MIGRATION COMPLETE
The backend has been successfully refactored into microservices, containerized, seeded with data, and pushed to the image registry. Use `docker-compose down` and `docker-compose up -d` to manage the stack. Since we are using host networking for DB in dev (5433), ensure ports are free or adjust config.
// turbo-all
