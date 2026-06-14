# syntax=docker/dockerfile:1

FROM maven:3.9-eclipse-temurin-21-alpine AS builder

WORKDIR /workspace

COPY pom.xml ./

COPY src ./src

RUN mvn -B -ntp -DskipTests package \
    && JAR_FILE="$(find target -maxdepth 1 -type f -name '*.jar' ! -name '*.original' | head -n 1)" \
    && test -n "$JAR_FILE" \
    && cp "$JAR_FILE" /workspace/app.jar


FROM eclipse-temurin:21-jre-alpine AS runtime

WORKDIR /app

RUN apk add --no-cache curl \
    && addgroup -S finance \
    && adduser -S finance -G finance

COPY --from=builder /workspace/app.jar /app/app.jar

RUN chown finance:finance /app/app.jar

USER finance

EXPOSE 8080

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-Djava.security.egd=file:/dev/./urandom", "-jar", "/app/app.jar"]
