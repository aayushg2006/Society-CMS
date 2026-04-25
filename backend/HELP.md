# Society Complaint Management System - Backend

Multi-tenancy Housing Society Complaint Management System built with Spring Boot.

## Prerequisites

- Java 25+
- Maven (or use the included Maven Wrapper)

## Running the Application

### Using Maven Wrapper (recommended - no Maven installation needed)

**Windows:**
```bash
.\mvnw.cmd spring-boot:run
```

**Linux/macOS:**
```bash
./mvnw spring-boot:run
```

### Using Maven (if installed)
```bash
mvn spring-boot:run
```

## Building

```bash
.\mvnw.cmd clean package
```

## Configuration

Application configuration is in `src/main/resources/application.yml`.

### Database
- **Database**: Supabase PostgreSQL
- **Host**: aws-1-ap-south-1.pooler.supabase.com
- **Port**: 5432

### API Keys
- **Google Maps API**: Configured in `application.yml` under `app.google-maps.api-key`

## Reference Documentation

* [Spring Boot Documentation](https://docs.spring.io/spring-boot/reference/)
* [Spring Data JPA](https://docs.spring.io/spring-boot/reference/data/sql.html)
* [Spring Security](https://docs.spring.io/spring-boot/reference/web/spring-security.html)
