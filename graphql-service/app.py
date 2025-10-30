import uvicorn
from strawberry.asgi import GraphQL
from schema import schema

app = GraphQL(schema)

if __name__ == "__main__":
    uvicorn.run("app:app", reload=True)