from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from policyengine import Simulation, SimulationOptions
import os

class CostingOptions(SimulationOptions):
    budget_window: int = 10

api = APIRouter()
app = FastAPI(
    title="Budget window calculator"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@api.post("/api/calculate-cost/")
def calculate_cost(request: CostingOptions):
    print("Hello!")
    request_data = request.model_dump()
    
    # Get budget window size (default to 10 if not provided)
    budget_window = int(request_data.get("budget_window"))
    start_year = 2025
    
    budgetary_impacts = []
    federal_revenue_impacts = []
    state_revenue_impacts = []
    benefit_spending_impacts = []

    for year in range(start_year, start_year + budget_window):
        print("Calculating for year:", year)
        request_data["time_period"] = year
        simulation = Simulation(**request_data)
        result = simulation.calculate_economy_comparison().budget
        
        budgetary_impacts.append(result.budgetary_impact)
        
        # Calculate federal revenue impact (total - state)
        state_revenue = result.state_tax_revenue_impact
        total_revenue = result.tax_revenue_impact
        federal_revenue = total_revenue - state_revenue
        
        federal_revenue_impacts.append(federal_revenue)
        state_revenue_impacts.append(state_revenue)
        benefit_spending_impacts.append(result.benefit_spending_impact)

    return {
        "budgetary_impact": budgetary_impacts,
        "federal_revenue_impact": federal_revenue_impacts,
        "state_revenue_impact": state_revenue_impacts,
        "benefit_spending_impact": benefit_spending_impacts,
    }

app.include_router(api, tags=["Budget window calculator"])

# Import and handle static file routes
from fastapi.staticfiles import StaticFiles
from pathlib import Path

# Setup API routes first
# Then setup static file serving (must be done after API routes)
static_dir = os.environ.get("STATIC_FILES_DIR", "../static")
static_path = Path(static_dir)

# Only serve static files if the directory exists
if static_path.exists() and static_path.is_dir():
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
else:
    # For development, still implement the catch-all for SPA
    from fastapi.responses import FileResponse
    
    @app.get("/{path:path}")
    async def catch_all(path: str):
        # Skip API routes
        if path.startswith("api/"):
            return {"message": f"Route {path} not found"}
        
        # For non-API routes, try to serve from static dir if it exists
        index_path = Path(static_dir) / "index.html"
        if static_path.exists() and static_path.is_dir() and index_path.exists():
            return FileResponse(index_path)
        
        # If static dir doesn't exist, return a message
        return {"message": "Frontend not built yet. This endpoint is for development only."}
