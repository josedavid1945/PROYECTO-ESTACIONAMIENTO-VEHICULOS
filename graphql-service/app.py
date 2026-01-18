import os
import uvicorn
from strawberry.asgi import GraphQL
from schema import schema
from starlette.middleware.cors import CORSMiddleware

# Crea la app GraphQL normal
graphql_app = GraphQL(schema)

# Obtener orígenes permitidos desde variable de entorno
# Por defecto permite localhost:4200 y localhost:3000
allowed_origins = os.getenv(
    "CORS_ORIGINS", 
    "http://localhost:4200,http://localhost:3000,http://127.0.0.1:4200"
).split(",")

# Envuelve con middleware CORS
app = CORSMiddleware(
    graphql_app,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", 8000))
    debug = os.getenv("DEBUG", "true").lower() == "true"
    uvicorn.run("app:app", host=host, port=port, reload=debug)