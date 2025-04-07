# US 10-Year Tax Reform Cost Calculator

A simple application to calculate 10-year budgetary costs for tax reforms. 

## Structure

- `app/backend`: FastAPI backend service
- `app/frontend`: Next.js frontend application

## Requirements

- Python 3.11
- Node.js and npm
- [uv](https://github.com/astral-sh/uv) (Python package manager)

## Getting Started

To start both the backend and frontend services:

```bash
make dev
```

This will:
1. Create a Python 3.11 virtual environment using uv
2. Install backend dependencies
3. Install frontend dependencies
4. Start the FastAPI server on port 8000
5. Start the Next.js development server on port 3000

Access the application at `http://localhost:3000`.

## Development

- Backend API: `http://localhost:8000`
- Frontend: `http://localhost:3000`

To stop all services:

```bash
make clean
```

## Commands

- `make install`: Install all dependencies
- `make backend`: Start only the backend server
- `make frontend`: Start only the frontend server
- `make clean`: Stop all running services
