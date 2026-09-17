import "server-only";

function getRequiredEnvironmentVariable(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Required environment variable ${name} is not configured.`);
  }

  return value;
}

export const serverEnvironment = {
  djangoApiUrl: getRequiredEnvironmentVariable("DJANGO_INTERNAL_API_URL"),
};
