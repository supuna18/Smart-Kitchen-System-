# 1. Build Stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj and restore
COPY ["SmartKitchen.Server/SmartKitchen.Server.csproj", "SmartKitchen.Server/"]
RUN dotnet restore "SmartKitchen.Server/SmartKitchen.Server.csproj"

# Copy everything else and build
COPY . .
WORKDIR "/src/SmartKitchen.Server"
RUN dotnet build "SmartKitchen.Server.csproj" -c Release -o /app/build

# Publish
RUN dotnet publish "SmartKitchen.Server.csproj" -c Release -o /app/publish

# 2. Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .

# Render එකට අවශ්‍ය Port එක සකස් කිරීම
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "SmartKitchen.Server.dll"]