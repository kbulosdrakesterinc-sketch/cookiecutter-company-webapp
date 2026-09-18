# Cookiecutter Company Web Application

A reusable Cookiecutter template for internal company web applications.

This repository provides a generic application foundation built with Django, Django REST Framework, PostgreSQL, Next.js, and Docker Compose.

The template is intentionally infrastructure-focused.

> The template supplies application infrastructure.
>
> Business domains belong to generated applications, not to the template.

---

## What this template is

This repository is a Cookiecutter project template for creating a new internal company web application with a proven full-stack foundation.

A generated project includes:

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

Do not place .venv inside:

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

## Check for business-domain leakage

From the template repository:

```bash
grep -RniEI \
  --exclude-dir='__pycache__' \
  --exclude-dir='node_modules' \
  --exclude-dir='.next' \
  --exclude-dir='.git' \
  'HRMS|employee|attendance|filing|biometric|collector|official business|leave request|approval|workforce|human resource' \
  '{{cookiecutter.project_slug}}' \
  || true
```

Review every match.

The target is no business-domain leakage.

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
