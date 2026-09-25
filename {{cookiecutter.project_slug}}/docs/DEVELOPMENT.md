# Developer guide

This guide is for developers working in a project generated from `cookiecutter-company-webapp`.

It describes the generated project's development workflow and the stable architectural contracts that should be preserved while application-specific modules are added.

## Prerequisites

Install:

- Git;
- Docker;
- Docker Compose.

Cookiecutter is not required after the project has already been generated.

Verify Docker:

```bash
docker --version
docker compose version
```

## Environment setup

From the generated project root:

```bash
cp .env.example .env
```

At minimum, replace:

```text
DJANGO_SECRET_KEY
POSTGRES_PASSWORD
```

The supplied `.env.example` also configures the local PostgreSQL database name/user, Django development settings, allowed hosts, activation timeout, the frontend public URL, the public app name, and the internal Django API URL used by Next.js.

Validate Compose before startup:

```bash
docker compose config
```

Start the local stack:

```bash
docker compose up -d --build
```

Apply migrations:

```bash
docker compose exec backend python manage.py migrate
```

## Local services

The development Compose file defines:

| Service | Purpose | Local port |
| --- | --- | --- |
| `database` | PostgreSQL | `5432` |
| `backend` | Django development server | `8000` |
| `frontend` | Next.js development server | `3000` |

Open the application at:

```text
http://localhost:3000
```

The backend port is exposed for development/debugging, but browser application code should still use the Next.js BFF rather than calling Django directly.

## First administrator

A new database contains no users. Create the initial administrator with Django's standard command:

```bash
docker compose exec backend python manage.py createsuperuser
```

The custom user model uses email instead of username, so provide the administrator email and password when prompted.

A Django superuser receives the normal Django all-permissions behavior. `is_staff` alone is **not** an application-authorization shortcut.

## Request boundary

The generated application uses this boundary:

```text
Browser
→ Next.js
→ Next.js BFF
→ Django REST Framework
→ PostgreSQL
```

Browser-side code must call Next.js routes. It must not use the internal Django URL directly.

Typical browser-facing calls are under `frontend/src/app/api/`. Those BFF routes call Django using the server-only `DJANGO_INTERNAL_API_URL`.

For shared server-side calls, `frontend/src/shared/server/django-fetch.ts` forwards request cookies and adds the Django CSRF header for unsafe methods when the CSRF cookie is present.

## Authentication and CSRF

Authentication uses Django sessions.

The project does not use JWT authentication.

At login, the Next.js BFF:

1. requests a Django CSRF token/cookie;
2. posts the email/password to Django with the CSRF cookie and `X-CSRFToken` header;
3. forwards the session/CSRF cookies from Django to the browser.

Authenticated requests then carry the normal Django session cookie. Logout is also sent through the BFF with CSRF protection.

Django `/api/v1/auth/me/`, exposed through the Next.js `/api/auth/me` BFF route, returns the current authenticated user's identity, group names, and effective Django permissions. The frontend maps that response into the `AuthUser` shape used by the application shell and Administration pages.

Do not bypass CSRF or introduce a separate browser-to-Django authentication path for new features.

## User provisioning and account activation

Administration can provision a user with email and optional first/last name. Provisioning creates an active account with an unusable password, so the user cannot sign in until an initial password is established through the activation flow.

The current provisioning request does **not** automatically send or return an activation link. If you need to exercise the built-in activation flow locally, you can generate a link explicitly:

```bash
docker compose exec backend python manage.py shell -c \
'from apps.accounts.models import User; from apps.accounts.services.activation import build_account_activation_link; u=User.objects.get(email="user@example.com"); print(build_account_activation_link(user=u).url)'
```

Open the generated URL through the frontend and set the initial password.

The activation token is time-limited by `DJANGO_ACCOUNT_ACTIVATION_TIMEOUT_SECONDS` and becomes unusable after the password has been established.

## Authorization

Django permissions are authoritative.

Backend permission classes call `user.has_perm(...)`. Preserve normal Django permission semantics:

- direct user permissions apply;
- group-inherited permissions apply;
- superuser permissions apply;
- `is_staff` alone does not grant application permissions.

Django `Group` is the application's role primitive. Do not add a custom Role model unless the architecture is deliberately redesigned in a future major change.

The frontend may hide navigation/actions based on the effective permission list returned through `/api/auth/me`, but every protected backend operation must still enforce its own permission.

## Administration modules

The generated v1 application includes four Administration areas.

### Users

Users supports a searchable/paginated directory, provisioning, viewing/editing supported fields, and activation/deactivation.

Permissions:

- `accounts.view_user`;
- `accounts.add_user`;
- `accounts.change_user`.

### Roles

Roles are Django Groups. The UI/API supports:

- directory and detail;
- create/rename;
- direct permission assignment;
- membership add/remove;
- membership-candidate search.

Permissions:

- `auth.view_group`;
- `auth.add_group`;
- `auth.change_group`.

### Audit Log

The Audit Log is read-only and requires:

```text
audit.view_auditevent
```

The directory can filter by action, target type, actor, and occurrence time range.

The current template records Administration mutations for users, roles, role membership/permissions, and Reference Data. It does not promise that every future business mutation is automatically audited.

### Reference Data

Reference Data provides controlled lookup sets and values.

Use it for stable lookup/reference values that can be configured without changing application behavior.

Do not use it as an arbitrary schema builder, workflow engine, state machine, or substitute for a real domain model. If changing a value changes transitions, calculations, or business validation, model that behavior in the owning domain module.

## Shared Administration UI primitives

Reusable Administration presentation is intentionally small:

- page header;
- empty state;
- pagination/href building.

Feature-owned code should continue to own forms, mutation behavior, business/domain rules, permission decisions, feature tables, and filters.

The project does not provide a generic CRUD framework.

## Project organization

Backend reusable foundation:

```text
backend/apps/
├── accounts/
├── audit/
├── core/
└── reference_data/
```

Frontend reusable foundation:

```text
frontend/src/
├── app/
│   ├── (app)/
│   ├── (auth)/
│   └── api/
├── features/
├── lib/server/
└── shared/
```

## Adding an application-specific module

New domain work normally belongs in this generated project.

For backend domain behavior, create a focused Django app under:

```text
backend/apps/<domain>/
```

Add it to `LOCAL_APPS` only when it is actually needed by this application.

For frontend feature behavior, use:

```text
frontend/src/features/<feature>/
```

Compose routes/pages under `frontend/src/app/` and expose browser-facing backend operations through `frontend/src/app/api/` BFF routes.

A practical extension sequence is:

1. define the domain model/service behavior;
2. define Django permissions and backend authorization;
3. expose DRF endpoints;
4. add Next.js BFF routes;
5. add frontend feature API wrappers/types/components;
6. add page/navigation integration;
7. add backend/frontend tests;
8. add audit events only where they are intentionally required.

Avoid moving application-specific behavior into `shared/` merely to reduce duplication.

## Reference Data versus domain models

Reference Data is a good fit when the application needs a controlled list with code/name/description/order/active state and changing the list does not change business algorithms.

Use a proper domain model when the concept has its own relationships, lifecycle, transitions, calculations, permission rules, or invariants.

## Audit extension guidance

`record_audit_event()` can be reused by generated domain services when an auditable mutation has a clear actor, action, target, and structured change payload.

Keep the audit write inside the same transaction boundary as the mutation when atomic behavior is required.

Do not assume the v1 audit table is a compliance archive or tamper-proof ledger.

## Backend quality gates

From the generated project root:

```bash
docker compose exec backend python manage.py check
docker compose exec backend python manage.py makemigrations --check
docker compose exec backend python manage.py test
docker compose exec backend basedpyright
```

`basedpyright` must report zero errors. Existing broad Django/DRF warnings may remain unless a warning identifies a concrete regression caused by your change.

## Frontend quality gates

```bash
docker compose exec frontend npm test
docker compose exec frontend npm run typecheck
docker compose exec frontend npm run lint
docker compose exec frontend npm run build
```

For any patch, also run:

```bash
git diff --check
```

## Optional local editor dependencies

The application runs in Docker, but local dependencies can improve editor navigation and IntelliSense.

Frontend:

```bash
cd frontend
npm install
```

Backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements/development.txt
```

Use Docker for the authoritative application commands and quality gates.

## Stop and reset

Stop services while preserving the database volume:

```bash
docker compose down
```

For a disposable local environment, remove named volumes too:

```bash
docker compose down -v
```

`docker compose down -v` deletes the local PostgreSQL data for this Compose project.

## Production scope

The repository includes a Django `production.py` settings module and a production requirements file, but v1 does not define a complete deployment platform, CI/CD system, secret manager, reverse proxy, observability stack, backup policy, or production database architecture.

Add those concerns according to the generated application's actual deployment environment rather than treating the local Compose file as production infrastructure.
