# Stage 1: Build React frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY src/Spots.App/package.json src/Spots.App/package-lock.json* ./
RUN npm install
COPY src/Spots.App/ ./
RUN npm run build

# Stage 2: Build .NET backend
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS backend-build
WORKDIR /app
COPY Spots.sln ./
COPY src/Spots.Api/Spots.Api.csproj src/Spots.Api/
RUN dotnet restore src/Spots.Api/Spots.Api.csproj
COPY src/Spots.Api/ src/Spots.Api/
RUN dotnet publish src/Spots.Api/Spots.Api.csproj -c Release -o /app/publish

# Stage 3: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=backend-build /app/publish ./
COPY --from=frontend-build /app/frontend/dist ./wwwroot/

# Create data directory
RUN mkdir -p /app/data

ENV ASPNETCORE_URLS=http://+:5000
ENV ConnectionStrings__DefaultConnection="Data Source=/app/data/spots.db"

EXPOSE 5000
ENTRYPOINT ["dotnet", "Spots.Api.dll"]
