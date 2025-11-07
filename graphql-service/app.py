import uvicorn
from strawberry.asgi import GraphQL
from schema import schema
from starlette.middleware.cors import CORSMiddleware

# Crea la app GraphQL normal
graphql_app = GraphQL(schema)

# Envuelve con middleware CORS
app = CORSMiddleware(
    graphql_app,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)