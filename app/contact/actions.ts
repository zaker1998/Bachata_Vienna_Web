"use server";

import { Resend } from "resend";
import { getServerEnv } from "@/lib/env";
import {
  createSharedRateLimiter,
  getClientIp,
  retryAfterMinutes,
} from "@/lib/rate-limit";
import {
  CONTACT_FIELDS,
  ContactSchema,
  collectFieldErrors,
  submittedValues,
  type ContactField,
} from "@/lib/validation";
import { escapeHtml } from "@/lib/utils";

export interface ContactResult {
  success: boolean;
  message: string;
  fieldErrors?: Partial<Record<ContactField, string>>;
  /** What the visitor typed, so the form can be refilled after an error. */
  values?: Partial<Record<ContactField, string>>;
}

const SUCCESS_MESSAGE = "Thanks — your message has been sent.";
const SEND_FAILED_MESSAGE =
  "Couldn't send your message right now. Please try again shortly.";

const contactRateLimiter = createSharedRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
});

export async function sendContactMessage(formData: FormData): Promise<ContactResult> {
  const values = submittedValues(formData, CONTACT_FIELDS);

  const ip = await getClientIp();
  const limit = await contactRateLimiter.consume(`contact:${ip}`);
  if (!limit.allowed) {
    const mins = retryAfterMinutes(limit.retryAfterMs);
    return {
      success: false,
      message: `Too many messages. Please try again in ${mins} minute${mins === 1 ? "" : "s"}.`,
      values,
    };
  }

  // Honeypot — checked before validation so bots get a plausible success
  // response instead of a validation error revealing the trap.
  if (formData.get("website")) {
    return { success: true, message: SUCCESS_MESSAGE };
  }

  const parsed = ContactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: collectFieldErrors(parsed.error.issues, CONTACT_FIELDS),
      values,
    };
  }

  let env: ReturnType<typeof getServerEnv>;
  try {
    env = getServerEnv();
  } catch (err) {
    console.error("Contact form env validation failed:", err);
    return {
      success: false,
      message: "Email is not configured yet. Please try again later.",
      values,
    };
  }

  const { name, email, message } = parsed.data;
  const resend = new Resend(env.RESEND_API_KEY);
  const to = env.CONTACT_EMAIL ?? env.INSTRUCTOR_EMAIL;

  try {
    const { error } = await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to,
      replyTo: email,
      subject: `New contact message from ${name}`,
      text: `From: ${name} <${email}>\n\n${message}`,
      html: `<p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
<p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
    });
    if (error) {
      console.error("Contact email send failed:", error);
      return { success: false, message: SEND_FAILED_MESSAGE, values };
    }
  } catch (err) {
    console.error("Contact email send failed:", err);
    return { success: false, message: SEND_FAILED_MESSAGE, values };
  }

  return { success: true, message: SUCCESS_MESSAGE };
}
