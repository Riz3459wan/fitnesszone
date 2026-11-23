# ---- build stage ----
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY pom.xml .
RUN mvn -B -q dependency:go-offline          # deps alag layer: code change pe dobara download nahi
COPY src ./src
RUN mvn -B -q package -DskipTests            # tests CI mein chalte hain, image build mein nahi

# ---- runtime stage ----
FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S app && adduser -S app -G app # root user se nahi chalayenge
WORKDIR /app
COPY --from=build /build/target/*.jar app.jar
USER app
EXPOSE 8080
# Container ki memory limit ke hisaab se heap (fixed -Xmx nahi)
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
