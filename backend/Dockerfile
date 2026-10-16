# Build stage
FROM maven:3.9.6-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN addgroup -S stockflow && adduser -S stockflow -G stockflow
COPY --from=builder /app/target/stockflow-backend-1.0.0.jar app.jar
USER stockflow
EXPOSE 8080
ENV SPRING_PROFILES_ACTIVE=mysql
ENTRYPOINT ["java", "-jar", "app.jar"]
