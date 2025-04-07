.PHONY: dev backend frontend install clean

# Default target
dev: backend frontend

# Create virtual environment with uv
.venv:
	uv venv -p 3.11

# Install backend dependencies
install-backend: .venv
	cd app/backend && uv pip install -r requirements.txt

# Install frontend dependencies
install-frontend:
	cd app/frontend && npm install

# Install all dependencies
install: install-backend install-frontend

# Start the backend server
backend:
	cd app/backend && fastapi dev

# Start the frontend server
frontend:
	cd app/frontend && npm run dev
