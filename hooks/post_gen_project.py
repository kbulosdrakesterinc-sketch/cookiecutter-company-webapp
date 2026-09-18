import re
import sys

PROJECT_SLUG = "{{ cookiecutter.project_slug }}"

PROJECT_SLUG_PATTERN = re.compile(
    r"^[a-z0-9][a-z0-9_-]*$",
)


def validate_project_slug() -> None:
    if PROJECT_SLUG_PATTERN.fullmatch(PROJECT_SLUG):
        return

    print(
        (
            f'Invalid project_slug "{PROJECT_SLUG}". '
            "Use only lowercase letters, numbers, hyphens, and underscores, "
            "and start with a letter or number."
        ),
        file=sys.stderr,
    )

    raise SystemExit(1)


def print_next_steps() -> None:
    print(f"""
Project created successfully.

Next steps:

  cd {PROJECT_SLUG}
  cp .env.example .env

Update at minimum:

  DJANGO_SECRET_KEY
  POSTGRES_PASSWORD

Then run:

  docker compose up -d --build
  docker compose exec backend python manage.py migrate
  docker compose exec backend python manage.py createsuperuser
""".strip())


def main() -> None:
    validate_project_slug()
    print_next_steps()


if __name__ == "__main__":
    main()
