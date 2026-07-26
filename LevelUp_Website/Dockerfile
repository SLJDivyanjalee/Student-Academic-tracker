# Build + run the LevelUp backend, serving the frontend from the same container.
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

COPY backend/src ./src
COPY backend/lib ./lib

RUN mkdir -p bin && \
    find src -name "*.java" > sources.txt && \
    javac -cp "lib/*" -d bin @sources.txt

FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=build /app/bin ./bin
COPY backend/lib ./lib
COPY frontend ./public

# Render sets PORT automatically; Main.java reads it via System.getenv("PORT")
EXPOSE 8080

CMD ["java", "-cp", "bin:lib/*", "com.levelup.Main"]
