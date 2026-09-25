# {{ cookiecutter.project_name }}

{{ cookiecutter.project_description }}

An internal company web application built with:

- Django
- Django REST Framework
- PostgreSQL
- Next.js
- Docker Compose

The project includes email-based authentication, Django session authentication, CSRF protection, account activation, a protected application shell, Administration capabilities, and a generic dashboard foundation.

The application keeps the browser boundary at Next.js:

```text
Browser
→ Next.js
→ Next.js BFF
→ Django REST Framework
→ PostgreSQL
```

Browser-side code should call the Next.js BFF rather than Django directly.

---

## Prerequisites

Install the following before starting development:

- Git
- Docker
- Docker Compose

Cookiecutter is only required when generating a new project from the template. It is not required to run an already generated project.

Verify Docker is available:

```bash
docker --version
docker compose version
```

## First-time setup

Create the local environment file:

```bash
cp .env.example .env
```

Update at minimum these values in `.env`:

```text
DJANGO_SECRET_KEY
POSTGRES_PASSWORD
```

Validate the rendered Compose configuration before startup:

```bash
docker compose config
```

Build and start the application:

```bash
docker compose up -d --build
```

Apply the database migrations:

```bash
docker compose exec backend python manage.py migrate
```

## First administrator

A fresh database has no application users. Bootstrap the first administrator with Django's standard superuser command:

```bash
docker compose exec backend python manage.py createsuperuser
```

This project uses email as the login identifier, so enter the administrator's email address and password when prompted.

The superuser follows normal Django permission semantics and can access the Administration features. `is_staff` by itself is not used as application authorization; normal application access continues to depend on Django permissions.

After the first administrator exists, additional users can be provisioned through the application's Administration user-management flow.

Open the frontend at:

```text
http://localhost:3000
```

Sign in with the superuser credentials you just created.

## Backend quality gates

Run these from the generated project root:

```bash
docker compose exec backend python manage.py check
docker compose exec backend python manage.py makemigrations --check
docker compose exec backend python manage.py test
docker compose exec backend basedpyright
```

Existing Django/DRF typing warnings may remain, but `basedpyright` should report zero errors.

## Frontend quality gates

```bash
docker compose exec frontend npm test
docker compose exec frontend npm run typecheck
docker compose exec frontend npm run lint
docker compose exec frontend npm run build
```

## Stop the local application

```bash
docker compose down
```

To also delete the local PostgreSQL volume for a disposable environment:

```bash
docker compose down -v
```
