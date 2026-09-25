# cookiecutter-company-webapp v1 baseline

This document defines the durable v1 contract for maintainers of the Cookiecutter template repository.

It describes the reusable foundation that the repository currently generates, the architectural boundaries that should remain stable, and the rules for deciding whether future work belongs in the template or in an application generated from it.

## Repository role

`cookiecutter-company-webapp` is a **Cookiecutter template repository**, not a deployable business application by itself.

The template repository owns cross-application foundation code. A rendered project owns the application-specific modules and business behavior built on top of that foundation.

The v1 foundation contains:

- email-based Django users;
- Django session authentication and CSRF protection;
- account activation primitives;
- a protected Next.js application shell;
- Django permission-based authorization;
- permission-aware current-user data and navigation;
- Administration for Users, Roles, Audit Log, and Reference Data;
- structured Administration audit events;
- fixed-schema Reference Data infrastructure;
- small shared Administration presentation primitives;
- Next.js BFF routes and server-side Django request helpers;
- Docker Compose development infrastructure;
- backend and frontend tests, type checks, linting, and build gates.

The template intentionally does not define application-specific business workflows.

## Supported stack

The generated project currently targets these repository-defined dependency ranges and versions:

- Django `>=5.2,<5.3`;
- Django REST Framework `>=3.16,<3.17`;
- PostgreSQL through the Compose `postgres:18-bookworm` image;
- Next.js `^16.3.0`;
- React `19.2.4`;
- TypeScript strict mode;
- Tailwind CSS 4;
- Docker Compose.

These values should be updated here only when the actual dependency files change.

## Cookiecutter inputs

`cookiecutter.json` currently defines:

| Variable | Purpose |
| --- | --- |
| `project_name` | Human-readable application name. |
| `project_slug` | Rendered project directory and Compose project identifier. Defaults from `project_name`. |
| `project_description` | Short generated-project description. |
| `organization_name` | Organization label available to the template. |
| `author_name` | Maintainer/author label available to the template. |
| `default_timezone` | Django `TIME_ZONE`; defaults to `Asia/Manila`. |

The post-generation hook validates that `project_slug` starts with a lowercase letter or number and otherwise contains only lowercase letters, numbers, hyphens, and underscores.

## Generation workflow

From the parent directory of this repository:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install cookiecutter
cookiecutter ./cookiecutter-company-webapp
```

For non-interactive verification, Cookiecutter can be run with `--no-input` and explicit variables.

The post-generation hook is intentionally small. It currently:

- validates `project_slug`;
- stops generation for an invalid slug;
- prints the first setup commands.

It deliberately does **not** install dependencies, create `.env`, run containers, migrate the database, create users, initialize Git, rewrite rendered source, or generate production secrets.

## Template repository structure

The important top-level paths are:

```text
cookiecutter-company-webapp/
├── cookiecutter.json
├── hooks/
│   └── post_gen_project.py
├── docs/
│   └── V1_BASELINE.md
└── {{cookiecutter.project_slug}}/
    ├── backend/
    ├── frontend/
    ├── compose.yaml
    ├── .env.example
    ├── .gitignore
    ├── README.md
    └── docs/
        └── DEVELOPMENT.md
```

Files below `{{cookiecutter.project_slug}}/` are rendered into every generated project. Files outside that directory are template-maintainer files unless the hook explicitly uses them.

## Generated-project architecture

The request boundary is:

```text
Browser
→ Next.js
→ Next.js BFF
→ Django REST Framework
→ PostgreSQL
```

This is a v1 architectural contract.

Browser-side code must not call Django directly. Client components and browser requests target Next.js routes such as `/api/users` or `/api/auth/login`. Next.js BFF routes forward to Django through the internal backend URL.

Server-side Next.js code may also call its own BFF routes when that preserves the same browser-facing contract, as the current-user flow does.

### Why the BFF boundary matters

The BFF keeps Django's internal service address out of browser code and centralizes session-cookie and CSRF forwarding behavior. New features should preserve this boundary rather than introducing one-off direct browser-to-Django calls.

## Authentication contract

The backend uses a custom `accounts.User` model derived from Django's `AbstractUser`:

- UUID primary key;
- no username field;
- unique email as `USERNAME_FIELD`;
- Django password hashing and validation.

Authentication uses Django sessions, not JWTs or application tokens.

The backend REST framework configuration uses `SessionAuthentication` and requires authenticated access by default. The authentication endpoints provide:

- `GET /api/v1/auth/csrf/`;
- `POST /api/v1/auth/login/`;
- `POST /api/v1/auth/logout/`;
- `GET /api/v1/auth/me/`;
- account-activation validation/submission routes.

The login and account-activation endpoints explicitly enforce CSRF even before a session exists. The Next.js login BFF obtains a CSRF token/cookie first, submits credentials to Django with `X-CSRFToken`, and forwards Django cookies back to the browser.

The shared server-side `djangoFetch` helper forwards incoming cookies and adds the CSRF header for unsafe methods when a CSRF cookie is present.

Do not replace this model with JWT authentication or bypass CSRF merely to simplify a new feature.

## Account provisioning and activation

Administration user provisioning creates an active account with no usable password. The activation service can generate a time-limited activation link and the activation endpoint lets the user establish the initial password.

The current provisioning mutation does not itself send or return an activation link. Applications that need delivery automation should add an explicit delivery mechanism appropriate to that application rather than assuming v1 already provides one.

## Authorization contract

Application authorization is based on Django's permission system.

The backend is authoritative. Permission classes call:

```python
user.has_perm("app_label.permission_codename")
```

Normal Django semantics are preserved:

- direct `User.user_permissions` count;
- permissions inherited through Django `Group` membership count;
- superusers receive Django's normal all-permissions behavior;
- `is_staff` alone does **not** grant application authorization.

The application does not define a custom Role model. Django `Group` is the role primitive.

Django `GET /api/v1/auth/me/` (exposed to the browser through the Next.js `/api/auth/me` BFF route) returns the current user's group names and the sorted result of `user.get_all_permissions()`. The frontend uses that permission list to hide or show navigation/actions, but frontend visibility is not a substitute for backend permission enforcement.

## Administration v1

The Administration navigation currently contains four areas.

### Users

Supported behavior includes:

- searchable paginated user directory;
- provision user with email/name fields;
- view one user;
- edit supported profile fields;
- activate/deactivate an account.

Relevant Django permissions are `accounts.view_user`, `accounts.add_user`, and `accounts.change_user`.

### Roles

Roles are Django `Group` records.

Supported behavior includes:

- searchable paginated roles directory;
- role detail;
- create role;
- rename role;
- assign/remove direct Django permissions;
- assign/remove users from role membership;
- search membership candidates.

Relevant Django permissions are the standard `auth.view_group`, `auth.add_group`, and `auth.change_group` permissions.

There is no custom Role model and no independent permission engine.

### Audit Log

The Audit Log is a read-only Administration directory gated by `audit.view_auditevent`.

It supports filtering by:

- action;
- target type;
- actor;
- occurred-after timestamp;
- occurred-before timestamp.

See the audit section below for what v1 actually records.

### Reference Data

Reference Data manages controlled lookup sets and values using a fixed schema.

A set contains:

- `code`, which the v1 API does not edit after creation;
- `name`;
- optional `description`;
- active state.

A value belongs to one set and contains:

- `code`, which the v1 API does not edit after creation;
- `name`;
- optional `description`;
- `sort_order`;
- active state.

Values are unique by `(reference_set, code)`.

Reference Data is intended for reusable lookup/reference values. It is **not**:

- an arbitrary schema builder;
- a generic CRUD framework;
- a workflow engine;
- a state machine;
- a replacement for proper domain models.

If changing a value would change calculations, transitions, validation rules, or other application behavior, that concept normally belongs in a domain model instead.

## Audit infrastructure v1

`apps.audit.models.AuditEvent` stores:

- occurrence time;
- optional actor foreign key;
- actor identifier snapshot;
- action string;
- target type/id/display metadata;
- structured `changes` JSON;
- optional `context` JSON.

`record_audit_event()` writes an event inside the caller's transaction boundary.

The current template emits audit events for these Administration mutations:

- user provisioned;
- user profile fields updated;
- user activated/deactivated;
- role created;
- role renamed;
- role direct permissions changed;
- role membership changed;
- Reference Data set created/updated/activated/deactivated;
- Reference Data value created/updated/activated/deactivated.

The model docstring calls events immutable "by application convention". v1 does not implement database-level append-only enforcement. It also does not claim regulatory compliance, retention guarantees, export guarantees, cryptographic integrity, or tamper-proof storage.

Generated domain modules may deliberately reuse the audit service, but doing so is application extension work, not a guarantee that every mutation is automatically audited.

## Shared Administration primitives v1

The shared frontend Administration layer currently contains only small presentation/navigation helpers:

- `AdministrationPageHeader`;
- `AdministrationEmptyState`;
- `AdministrationPagination` and its href builder.

These primitives standardize repeated presentation without taking ownership of feature behavior.

Keep these responsibilities feature-owned unless a future change proves a genuinely cross-feature abstraction:

- business/domain logic;
- backend permission rules;
- forms and validation;
- mutation semantics;
- feature-specific tables;
- filtering/search behavior;
- domain-specific empty states or workflows.

Do not describe or evolve the current primitives as a generic CRUD framework.

## Backend organization

The generated backend currently has these reusable apps:

```text
backend/apps/
├── accounts/
├── audit/
├── core/
└── reference_data/
```

`accounts` owns identity, authentication-facing API behavior, user administration, Django Group role administration, and related services.

`audit` owns structured audit persistence, queries, and the read-only Audit Log API.

`core` contains project-wide backend utilities such as shared pagination behavior.

`reference_data` owns the fixed-schema lookup models, services, queries, permissions, and API.

New application-specific backend modules should normally be added as separate Django apps under `backend/apps/` in the **generated project**, not backported into the Cookiecutter template by default.

## Frontend organization

The generated frontend follows Next.js App Router conventions and separates route composition from feature code:

```text
frontend/src/
├── app/
│   ├── (app)/
│   ├── (auth)/
│   └── api/
├── features/
│   ├── audit/
│   ├── auth/
│   ├── dashboard/
│   ├── reference-data/
│   ├── roles/
│   └── users/
├── lib/server/
└── shared/
```

Application-specific frontend modules should normally become feature directories under `frontend/src/features/` with App Router pages and corresponding BFF routes under `frontend/src/app/api/`.

## Safe extension pattern

When adding a new generated-project feature, preserve this order of responsibility:

1. Model domain behavior in its own backend app when persistence or business rules require it.
2. Define Django model permissions or explicit permission checks on backend API endpoints.
3. Keep mutation behavior in feature/domain services rather than hiding it in shared UI helpers.
4. Expose Django REST Framework endpoints through the existing API version namespace.
5. Add a Next.js BFF route for browser-facing calls.
6. Put frontend API wrappers, types, forms, tables, and feature behavior under the feature directory.
7. Add navigation visibility only after backend authorization exists.
8. Add tests at the backend and frontend layers affected by the change.
9. Emit audit events only for mutations for which an audit record is meaningful and intentionally defined.

## What belongs in the reusable template

A change is a strong template candidate when it is cross-cutting, stable, and likely to be useful in many generated applications without encoding one application's rules.

Current examples are authentication, authorization, account administration, roles/permissions, audit infrastructure, Reference Data, the BFF boundary, shared Administration presentation primitives, and development/testing infrastructure.

## What stays application-specific

Keep a feature in the generated project when it defines one application's:

- domain entities;
- workflow transitions;
- approval rules;
- calculations;
- specialized reports;
- external integrations that are not universally required;
- business-specific Administration screens;
- terminology and navigation.

Do not generalize an application feature into the template merely because a second project might someday need something similar.

## Quality gates

The generated project is expected to pass these backend gates:

```bash
docker compose exec backend python manage.py check
docker compose exec backend python manage.py makemigrations --check
docker compose exec backend python manage.py test
docker compose exec backend basedpyright
```

The `basedpyright` v1 gate is zero errors. The existing broad Django/DRF warning backlog is not a reason to rewrite otherwise-correct code.

Frontend gates are:

```bash
docker compose exec frontend npm test
docker compose exec frontend npm run typecheck
docker compose exec frontend npm run lint
docker compose exec frontend npm run build
```

Template/documentation changes should also pass:

```bash
git diff --check
```

## Fresh-generation verification contract

Before declaring a template baseline, a disposable newly rendered project should be verified rather than testing only the template source tree.

The v1 verification checklist is:

- render without unresolved Cookiecutter variables;
- validate `docker compose config`;
- build/start Compose services;
- run Django system checks;
- confirm migration consistency;
- migrate a new database from zero;
- run backend tests;
- run `basedpyright` with zero errors;
- run frontend Vitest;
- run TypeScript typecheck;
- run ESLint;
- run the Next.js production build.

Disposable verification projects must not be committed back into the template repository.

## Maintainer hygiene

Do not commit generated caches or local environments. The template root ignores Python bytecode/cache files and the maintainer `.venv`; the generated project has its own broader `.gitignore`.

Documentation should describe stable contracts rather than duplicate every implementation detail. When the implementation changes, update the closest durable contract and remove statements that over-promise behavior the code does not provide.

## v1 baseline definition

A commit is suitable to label as the `cookiecutter-company-webapp` v1 baseline when:

- the template and generated-project documentation match the current implementation;
- the reusable/application-specific boundary is explicit;
- the fresh-generation checklist has passed on the candidate commit;
- `main` and `origin/main` are synchronized;
- the working tree is clean;
- no known critical v1 contract contradiction is being intentionally shipped.

Tagging and release publication remain explicit maintainer actions; the template does not currently contain a repository-defined release automation mechanism.
