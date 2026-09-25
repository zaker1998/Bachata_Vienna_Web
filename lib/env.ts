import { z } from "zod";
import { PUBLIC_CONTACT_EMAIL } from "@/lib/constants";

// Empty string (e.g. a blank Vercel "sensitive" var) must not win over the
// default — Zod only applies `.default()` when the value is `undefined`, so a
// blank var would fail `.min(1)` and take the whole app down at boot.
const blankAsUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), schema);

const serverSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  ADMIN_PASSWORD: z.string().min(8, "ADMIN_PASSWORD must be at least 8 characters"),
  ADMIN_USERNAME: blankAsUndefined(z.string().min(1).default("admin")),
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: blankAsUndefined(
    z.string().min(1).default("Bachata Vienna <onboarding@resend.dev>")
  ),
  INSTRUCTOR_EMAIL: blankAsUndefined(
    z.string().email().default(PUBLIC_CONTACT_EMAIL)
  ),
  CONTACT_EMAIL: blankAsUndefined(z.string().email().optional()),
  // Reply-To on guest emails; falls back to PUBLIC_CONTACT_EMAIL.
  REPLY_TO_EMAIL: blankAsUndefined(z.string().email().optional()),
  NEXT_PUBLIC_SITE_URL: blankAsUndefined(
    z.string().url().default("http://localhost:3000")
  ),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cached) return cached;

  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${issues}`);
  }

  cached = parsed.data;
  return cached;
}

/** Test-only: drop the memoized env so a new `process.env` is re-read. */
export function resetServerEnvCache() {
  cached = null;
}
