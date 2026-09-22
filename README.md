# Cookiecutter Company Web Application

A reusable Cookiecutter template for internal company web applications.

This repository provides a generic company-application foundation built with Django, Django REST Framework, PostgreSQL, Next.js, and Docker Compose.

The template is intentionally focused on capabilities that are useful across many internal company systems: authentication, authorization, application navigation, administration, user management, reusable CRUD infrastructure, auditing, and API/BFF integration.

> The template supplies shared company-application infrastructure and cross-cutting administrative capabilities.
>
> Project-specific business domains belong to generated applications, not to the template.

Examples of project-specific domains include warehouses, products, orders, attendance, payroll, tickets, assets, and other workflow-specific concepts.

---

## What this template is

This repository is a Cookiecutter project template for creating a new internal company web application with a proven full-stack foundation.

A generated project follows this request path:

```text
Browser
  ↓
Next.js
  ↓
Next.js BFF routes
  ↓
Django REST Framework
  ↓
PostgreSQL
```

The goal is not to generate an empty technical skeleton. The goal is to generate the common platform layer that most company applications would otherwise need to rebuild before domain work can begin.

## Template baseline

The reusable boilerplate is intended to provide the following baseline capabilities:

```text
COOKIECUTTER BOILERPLATE
│
├── Authentication
├── Account activation
├── Authorization
├── Application shell
├── Dashboard
├── Administration shell
├── User management
├── Generic CRUD building blocks
├── Audit infrastructure
├── Reference-data infrastructure
└── API/BFF infrastructure
```

These are horizontal capabilities: they support many kinds of company applications without defining what the application itself does.

A generated application then adds its own business domains. For example, an e-commerce project may add:

```text
GENERATED E-COMMERCE APPLICATION
│
├── Warehouses
├── Products
├── Customers
├── Orders
├── Payments
├── Delivery
└── Domain statuses and workflows
```

An HRMS, ticketing system, asset-management application, or another internal system would add different domain modules while keeping the same reusable platform foundation.

## Template boundary

A feature belongs in the Cookiecutter template when it is expected to be useful across many generated applications and does not encode one application's business rules.

Typical template concerns include:

- login, logout, sessions, and account activation;
- users, roles, groups, and permissions;
- authenticated application layout and navigation;
- administration pages and reusable management UI patterns;
- tables, forms, filtering, pagination, empty states, and confirmation flows;
- audit metadata and audit-event infrastructure;
- reusable API and BFF request handling;
- generic reference-data infrastructure when the values do not encode workflow rules.

Project-specific concepts stay in generated applications. Examples include:

- warehouse and inventory behavior;
- product catalogs;
- order, payment, and delivery workflows;
- attendance and payroll rules;
- ticket lifecycles;
- asset movement rules;
- approval workflows that are specific to one system.

A useful rule is:

> If the feature manages the application itself, it probably belongs in the template.
>
> If the feature describes the company's domain process, it probably belongs in the generated application.

## Administration versus business domains

The generated application may include an **Administration** area by default, but Administration is a shell rather than a single business domain.

The template may provide pages such as:

```text
Administration
├── Users
├── Roles & Permissions
├── Reference Data
└── Audit Log
```

A generated project can extend the same Administration area with project-specific management pages:

```text
Administration
├── Users
├── Roles & Permissions
├── Reference Data
├── Audit Log
├── Warehouses
└── Other project-specific master data
```

This keeps the user experience consistent without forcing e-commerce, HRMS, ticketing, or asset-management concepts into every generated project.

## User management

User management is part of the template because authenticated company applications commonly need administrators to provision and maintain accounts.

The existing account-activation flow can support a safe provisioning model:

```text
Administrator creates/provisions user
  ↓
User has no usable password yet
  ↓
Activation link is generated
  ↓
User creates an initial password
  ↓
Account becomes usable
```

Generated applications may attach additional domain profiles to the platform user, but the core user identity remains part of the shared foundation.

## Authorization

Authentication answers **who the user is**. Authorization answers **what the user is allowed to do**.

Authorization belongs in the template because every generated application should enforce permissions consistently at the backend, regardless of whether the frontend hides or shows a navigation item.

Django groups and permissions can provide the initial foundation, with project-specific permissions added by generated domain applications.

## Reference data and statuses

The template may provide generic reference-data infrastructure, but it should not assume that every status is interchangeable.

For example, a generated e-commerce application may define order, payment, warehouse, and delivery statuses separately. If a status controls business workflow or transitions, that behavior belongs to the relevant domain rather than to a universal `Status` model.

Generic reference data should be reserved for values that are genuinely configurable without changing business logic.

## Audit infrastructure

The template should make it possible to record administrative and business changes consistently, including information such as:

```text
who changed something
what changed
when it changed
```

Generated domains can then emit their own audit events without implementing a new audit mechanism for each project.

---

## Install Cookiecutter

Cookiecutter is only required to generate projects from this repository.

A local virtual environment is recommended.

From the template repository:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Upgrade pip:

```bash
pip install --upgrade pip
```

Install Cookiecutter:

```bash
pip install cookiecutter
```

Verify the installation:

```bash
cookiecutter --version
```

The repository tooling virtual environment must remain outside the generated project template.

Do not place `.venv` inside:

```text
{{cookiecutter.project_slug}}/
```

because Cookiecutter attempts to process files inside the template directory.

## Generate a project

From the parent directory of this repository:

```bash
cookiecutter ./cookiecutter-company-webapp
```

Cookiecutter will prompt for the template variables.

A typical example:

```text
project_name: Company Web Application
project_slug: company-web-application
project_description: Internal company web application
organization_name: Your Company
author_name: IT Department
default_timezone: Asia/Manila
```

After generation, the post-generation hook prints the initial setup commands.

A generated project will look approximately like:

```text
company-web-application/
├── backend/
├── frontend/
├── compose.yaml
├── .env.example
├── .gitignore
└── README.md
```

## Generate non-interactively

Cookiecutter can also render the template without prompts.

Example:

```bash
cookiecutter \
  --no-input \
  --default-config \
  ./cookiecutter-company-webapp \
  project_name="Test Internal App" \
  project_slug="test-internal-app" \
  project_description="Internal company web application" \
  organization_name="Your Company" \
  author_name="IT Department" \
  default_timezone="Asia/Manila"
```

This is useful for automated template verification.

## Post-generation hook

The template includes:

```text
hooks/post_gen_project.py
```

The hook is intentionally small.

Its responsibilities are:

- validate the rendered `project_slug`;
- reject invalid slugs;
- print initial setup instructions.

The hook deliberately does not:

- install Python packages;
- install npm packages;
- run Docker;
- run migrations;
- create users;
- initialize Git;
- rewrite generated source files;
- create `.env`;
- generate production secrets.

The generated developer remains in control of those steps.

Keeping hooks small makes the template easier to understand and maintain.

## Run backend quality gates

```bash
docker compose exec backend python manage.py check
```

```bash
docker compose exec backend python manage.py makemigrations --check
```

```bash
docker compose exec backend python manage.py test
```

```bash
docker compose exec backend basedpyright
```

All must pass on the freshly generated project.

## Run frontend quality gates

```bash
docker compose exec frontend npm test
```

```bash
docker compose exec frontend npm run typecheck
```

```bash
docker compose exec frontend npm run lint
```

```bash
docker compose exec frontend npm run build
```

All must pass without manually editing the generated source.

## Test authentication manually

Create a superuser:

```bash
docker compose exec backend python manage.py createsuperuser
```

Then verify:

```text
anonymous request
→ /login
→ valid credentials
→ session created
→ /dashboard
→ current user shown
→ logout
→ /login
```

Also verify protected-route behavior without a valid session.

## Test account activation

Create a provisioned user without a usable password.

Example:

```bash
docker compose exec backend python manage.py shell -c \
'from apps.accounts.models import User; u=User.objects.create_user(email="maria@example.com", password=None, first_name="Maria", last_name="Santos"); print(u.email, u.has_usable_password())'
```

Generate an activation URL:

```bash
docker compose exec backend python manage.py shell -c \
'from apps.accounts.models import User; from apps.accounts.services.activation import build_account_activation_link; u=User.objects.get(email="maria@example.com"); print(build_account_activation_link(user=u).url)'
```

Verify:

```text
activation link validation
→ initial password creation
→ successful activation
→ original token cannot be reused
→ login works with new password
```

## Check for unresolved Cookiecutter expressions

From the rendered project:

```bash
grep -RniI '{{ *cookiecutter' . \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=.git \
  || true
```

Expected:

```text
no output
```

## Check the template boundary

The template should contain shared company-application capabilities but should not accidentally absorb one project's business domain.

From the template repository, search for domain-specific terms that should not be part of the generic foundation. For example:

```bash
grep -RniEI \
  --exclude-dir='__pycache__' \
  --exclude-dir='node_modules' \
  --exclude-dir='.next' \
  --exclude-dir='.git' \
  'HRMS|attendance|filing|biometric|payroll|warehouse|inventory|product|order|payment|delivery|ticket|asset movement' \
  '{{cookiecutter.project_slug}}' \
  || true
```

Review every match rather than treating every match as automatically invalid. Documentation may intentionally mention domain examples, while generated source code should remain generic unless the feature is deliberately part of the reusable baseline.

## Disposable test projects

Rendered projects used to test this template should be treated as disposable.

Do not commit them into the template repository.

To stop a disposable generated project:

```bash
docker compose down
```

To also remove its named volumes:

```bash
docker compose down -v
```

Then remove the rendered directory when finished.

Example:

```bash
rm -rf template-test-app
```

Be careful with `docker compose down -v`: it deletes the generated project's local PostgreSQL data.
