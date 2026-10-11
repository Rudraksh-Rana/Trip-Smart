import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from recommender import rank_alternatives, rank_recommendations
from price_forecaster import forecast_price
from budget_allocator import allocate_budget, record_feedback

app = FastAPI(title="TripSmart Recommendation Service", version="0.1.0")

# CORS configuration
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RecommendationRequest(BaseModel):
    user_trips: list[dict] = Field(default_factory=list)
    candidate_trips: list[dict] = Field(default_factory=list)
    limit: int = Field(default=6, ge=1, le=50)


class AlternativesRequest(BaseModel):
    current_plan: dict


class PriceForecastRequest(BaseModel):
    current_price: float = Field(gt=0)
    departure_date: str | None = None
    transport_mode: str = "flight"
    fare_history: list[dict] = Field(default_factory=list)


class BudgetAllocationRequest(BaseModel):
    remaining_budget: float = Field(ge=0)
    context: dict = Field(default_factory=dict)


class BudgetFeedbackRequest(BaseModel):
    category: str
    reward: float = Field(ge=0, le=1)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "recommendation-engine"}


@app.post("/recommend")
def recommend(request: RecommendationRequest) -> dict:
    return {
        "model": "content-collaborative-knn-v1",
        "recommendations": rank_recommendations(
            request.user_trips,
            request.candidate_trips,
            request.limit,
        ),
    }


@app.post("/alternatives")
def alternatives(request: AlternativesRequest) -> dict:
    return {
        "model": "content-alternatives-v1",
        "recommendations": rank_alternatives(request.current_plan),
    }


@app.post("/price-forecast")
def price_forecast(request: PriceForecastRequest) -> dict:
    return forecast_price(**request.model_dump())


@app.post("/budget-allocation")
def budget_allocation(request: BudgetAllocationRequest) -> dict:
    return allocate_budget(request.remaining_budget, request.context)


@app.post("/budget-feedback")
def budget_feedback(request: BudgetFeedbackRequest) -> dict:
    return record_feedback(request.category, request.reward)
