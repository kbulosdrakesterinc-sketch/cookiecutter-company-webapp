import { cookies } from "next/headers";
import "server-only";

export async function getIncomingCookieHeader(): Promise<string> {
  const cookieStore = await cookies();

  return cookieStore
    .getAll()
    .map(({ name, value }) => {
      return `${name}=${value}`;
    })
    .join("; ");
}
