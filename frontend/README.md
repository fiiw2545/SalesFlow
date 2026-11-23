# SalesFlow CRM – Frontend

The frontend application for **SalesFlow CRM**, a full-stack Customer Relationship Management system built to help organizations manage customers, companies, deals, sales pipelines, tasks, and team collaboration.

Built with React, TypeScript, and Vite, the application provides an organization-based CRM interface with authentication, dashboard analytics, data management, and notifications.

## Technology Stack

| Category                         | Technologies                  |
| -------------------------------- | ----------------------------- |
| Framework                        | React 19                      |
| Language                         | TypeScript                    |
| Build Tool                       | Vite                          |
| Routing                          | React Router                  |
| Data Fetching & State Management | TanStack Query                |
| HTTP Client                      | Axios                         |
| Forms                            | React Hook Form               |
| Validation                       | Zod                           |
| Charts                           | Recharts                      |
| Styling                          | Tailwind CSS                  |
| Unit & Component Testing         | Vitest, React Testing Library |
| E2E Testing                      | Playwright                    |

## Features

### Authentication

- User registration and login
- Cookie-based authentication
- Access and refresh token lifecycle management
- Session-aware authentication
- Protected routes
- Role-based access control

### Organization Management

- Organization selection and management
- Organization member management
- Organization invitations
- Organization-scoped data access

### CRM Management

- Dashboard and analytics
- Contact and company management
- Sales pipeline and stage management
- Deal tracking
- Tasks and activities
- Notes and tags
- Global search

### Account & Notifications

- User account management
- In-app notifications
- Notification management
- Profile menu and account navigation

## Project Structure

```text
frontend/
├── public/
│   └── runtime-config.js
│
├── src/
│   ├── api/
│   ├── assets/
│   ├── components/
│   ├── features/
│   ├── hooks/
│   ├── layouts/
│   ├── pages/
│   ├── routes/
│   ├── styles/
│   ├── test/
│   ├── types/
│   └── utils/
│
├── package.json
├── package-lock.json
├── tsconfig.json
└── vite.config.ts
```

### Directory Responsibilities

| Directory     | Responsibility                                  |
| ------------- | ----------------------------------------------- |
| `api/`        | API client and HTTP communication               |
| `assets/`     | Static assets                                   |
| `components/` | Shared UI components                            |
| `features/`   | Feature-specific application modules            |
| `hooks/`      | Reusable React hooks                            |
| `layouts/`    | Application layout components                   |
| `pages/`      | Application pages                               |
| `routes/`     | Route configuration and route protection        |
| `styles/`     | Global styles and styling configuration         |
| `test/`       | Test configuration and shared testing utilities |
| `types/`      | TypeScript type definitions                     |
| `utils/`      | Shared utility functions                        |

## Getting Started

### Prerequisites

- Node.js 24
- npm
- SalesFlow Backend API running locally

### 1. Install Dependencies

From the repository root:

```bash
cd frontend
npm ci
```

### 2. Configure the Backend API URL

The frontend uses runtime configuration to determine the backend API URL.

Open:

```text
public/runtime-config.js
```

Configure the API URL:

```javascript
window.SALESFLOW_CONFIG = {
  API_BASE_URL: "http://localhost:8000",
};
```

Make sure the configured URL matches the address of your running backend.

### 3. Start the Development Server

```bash
npm run dev
```

Vite will start the development server and display the local frontend URL in the terminal.

## Available Scripts

Run these commands from the `frontend/` directory.

| Command                   | Description                      |
| ------------------------- | -------------------------------- |
| `npm run dev`             | Start the development server     |
| `npm run build`           | Build the production application |
| `npm run preview`         | Preview the production build     |
| `npm run lint`            | Run lint checks                  |
| `npm run test`            | Run frontend tests               |
| `npm run test:run`        | Run frontend tests once          |
| `npm run test:e2e`        | Run Playwright end-to-end tests  |
| `npm run test:e2e:ui`     | Open the Playwright UI           |
| `npm run test:e2e:report` | View the Playwright test report  |

## Testing

### Unit & Component Tests

Run the frontend test suite:

```bash
npm run test:run
```

The project uses Vitest and React Testing Library for unit and component testing.

### End-to-End Tests

Run browser-based tests:

```bash
npm run test:e2e
```

Playwright is used to verify important application workflows through browser interactions.

### Lint

```bash
npm run lint
```

### Production Build

```bash
npm run build
```

The production build output is generated in the `dist/` directory.

## Environment & Configuration

The frontend API endpoint is configured through:

```text
public/runtime-config.js
```

This allows the API URL to be configured at runtime without relying on a frontend build-time environment variable.

Do not store API secrets, private credentials, or sensitive authentication information in frontend source code or runtime configuration.

## Backend Integration

The frontend communicates with the SalesFlow Backend through REST APIs.

The backend is responsible for:

- Authentication and session management
- Authorization and organization membership checks
- CRM business logic
- Database operations
- External service integrations

The frontend handles the user interface, client-side navigation, form interactions, and API data presentation.

## Project Status

**Frontend development and QA completed.**

The frontend is part of the SalesFlow CRM portfolio project. Production hosting and deployment are outside the current project scope.

For the complete project overview, backend documentation, architecture, and screenshots, see the [Root README](../README.md).
