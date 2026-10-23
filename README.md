# StockFlow — Enterprise Inventory & Order Management System

[![Java](https://img.shields.io/badge/Java-21%20%7C%2017-orange?logo=openjdk)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.4-brightgreen?logo=springboot)](https://spring.io/projects/spring-boot)
[![Spring Security](https://img.shields.io/badge/Spring%20Security-JWT-blue?logo=springsecurity)](https://spring.io/projects/spring-security)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue?logo=mysql)](https://www.mysql.com/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ed?logo=docker)](https://www.docker.com/)

StockFlow is a full-stack inventory and order management system designed for small and medium-sized businesses. It helps manage products, suppliers, warehouses, stock levels, customer orders, and inventory activity through a centralized application.

The project focuses on practical software engineering concepts, including layered architecture, REST APIs, authentication, role-based access control, database transactions, inventory consistency, and automated testing.

## Features

- **Product management:** Maintain product information, SKUs, and categories.
- **Inventory tracking:** Monitor stock levels across multiple warehouses.
- **Supplier management:** Organize supplier information and stock deliveries.
- **Order management:** Create orders and track their lifecycle.
- **Stock consistency:** Use database locking and transactions to help prevent overselling.
- **Role-based access control:** Separate permissions for administrators, inventory managers, and sales employees.
- **Audit logging:** Track important inventory and order changes.
- **Reports:** Support inventory and order reporting, including CSV exports where implemented.
- **API documentation:** Document REST endpoints using OpenAPI/Swagger where configured.
- **Automated tests:** Test business logic and critical inventory operations.
- **Container support:** Run the application with Docker Compose if the configuration is included.

## Technology Stack

| Layer | Technology |
|---|---|
| Backend | Java, Spring Boot |
| Security | Spring Security, JWT |
| Persistence | Spring Data JPA, Hibernate |
| Database | MySQL; H2 may be used for local testing |
| Frontend | React, JavaScript, CSS |
| Build tool | Maven |
| Testing | JUnit 5, Mockito, Spring Boot Test |
| API documentation | OpenAPI / Swagger |
| Containerization | Docker, Docker Compose |
| Version control | Git, GitHub |

> Check the project files to confirm the exact versions and which optional integrations are configured.

## Architecture

The application follows a layered architecture:

```text
React Frontend
      |
      | HTTP / REST API
      v
Spring Boot Controllers
      |
      v
Service Layer
(Business Rules and Transactions)
      |
      v
Spring Data JPA Repositories
      |
      v
Database (MySQL / H2)
```

The controller layer handles incoming API requests, the service layer implements business rules, and the repository layer manages database operations.

## Core Modules

### 1. Authentication and Authorization
- User login and authentication.
- Role-based permissions for protected operations.
- Roles may include `ROLE_ADMIN`, `ROLE_INVENTORY_MANAGER`, and `ROLE_SALES_EMPLOYEE`.

### 2. Product and Supplier Management
- Maintain product and category information.
- Associate products with suppliers.
- Search and filter product records.

### 3. Inventory Management
- View stock by product and warehouse.
- Record stock receipts and adjustments.
- Track inventory movements.
- Support warehouse transfers if implemented.

### 4. Order Management
- Create and track customer orders.
- Validate order status transitions.
- Deduct stock when an order is confirmed.
- Restore stock when an eligible order is cancelled, if implemented.

### 5. Reporting and Audit
- View inventory and order summaries.
- Export reports where available.
- Record important changes for traceability.

## Concurrency and Data Integrity

Inventory systems must handle cases where multiple orders attempt to purchase the same available stock. StockFlow can use transactional service methods and database-level pessimistic locking to ensure that stock is checked and updated safely.

For example, Spring Data JPA supports locking repository queries with `@Lock(LockModeType.PESSIMISTIC_WRITE)`. When correctly applied within a transaction, this can prevent concurrent transactions from allocating the same inventory units.

The actual locking strategy and test coverage should be verified against the implementation in this repository.

## Getting Started

### Prerequisites

Install the following tools as required by your project configuration:

- Java 17 or Java 21 JDK
- Node.js and npm
- Git
- MySQL, or Docker if a Compose configuration is provided

### 1. Clone the repository

```bash
git clone https://github.com/HarshiniKC03/StockFlow.git
cd StockFlow
```

### 2. Start the backend

If the backend is located in a `backend` directory and includes a Maven wrapper:

**Windows (PowerShell or Command Prompt):**

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

**macOS / Linux:**

```bash
cd backend
./mvnw spring-boot:run
```

If there is no Maven wrapper, use Maven installed on your system:

```bash
mvn spring-boot:run
```

Configure the database and other required settings according to the application's configuration files. Do not commit real passwords, tokens, or other secrets.

### 3. Start the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The development server address will be shown in the terminal. A common Vite address is `http://localhost:5173`.

### 4. Run tests

If the backend includes a Maven wrapper:

**Windows:**

```powershell
cd backend
.\mvnw.cmd test
```

**macOS / Linux:**

```bash
cd backend
./mvnw test
```

Otherwise, run:

```bash
mvn test
```

### 5. Run with Docker Compose (Optional)

If the repository contains a `docker-compose.yml` file and the necessary configuration is set up, run:

```bash
docker compose up --build
```

## API Documentation

If OpenAPI/Swagger is configured in the backend, start the application and open the documentation URL configured by the project. A common Springdoc URL is:

```text
http://localhost:8080/swagger-ui/index.html
```

The exact URL depends on the project's dependencies and configuration.

## Example API Areas

The API may provide endpoints for these functional areas, depending on the implementation:

| Area | Example operations |
|---|---|
| Authentication | Login |
| Products | List, search, create, update |
| Inventory | View stock, receive stock, adjust stock |
| Orders | Create, confirm, cancel, track |
| Reports | Dashboard summaries, CSV exports |
| Audit | View audit events |

Refer to the actual controller classes or Swagger documentation for the available endpoints.

## Project Structure

A typical project layout may look like this:

```text
StockFlow/
├── backend/
│   ├── src/
│   ├── pom.xml
│   └── mvnw / mvnw.cmd
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml
├── .gitignore
├── LICENSE
└── README.md
```

The exact structure may differ depending on the files currently in the repository.

## Future Improvements

- Add more integration and concurrency tests.
- Add CI workflows for automated builds and tests.
- Add deployment instructions for a cloud environment.
- Improve monitoring, error handling, and operational documentation.
- Add more comprehensive API examples and screenshots.

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Make and test your changes.
4. Submit a pull request with a clear description.
