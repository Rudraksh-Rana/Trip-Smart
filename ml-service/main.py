# Entry point for deployment and local execution (supports uvicorn main:app and uvicorn main:main)
from app import app  # noqa: F401 - re-exported for uvicorn

# Alias so `uvicorn main:main` also works
main = app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8001, reload=True)
