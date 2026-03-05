import { redirect } from "next/navigation";

type ErrorWithCode = { code?: unknown };
type ErrorWithDigest = { digest?: unknown };

type RedirectOptions = {
  context: string;
  retryPath: string;
};

const MAX_QUERY_VALUE_LENGTH = 400;

function truncate(value: string, max = MAX_QUERY_VALUE_LENGTH): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 3)}...`;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return "No additional details were provided.";
}

function getErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const code = (error as ErrorWithCode).code;
  return typeof code === "string" ? code : undefined;
}

function isNextControlFlowError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const digest = (error as ErrorWithDigest).digest;
  if (typeof digest !== "string") return false;

  return (
    digest.includes("NEXT_REDIRECT") ||
    digest.includes("NEXT_NOT_FOUND") ||
    digest.includes("NEXT_HTTP_ERROR_FALLBACK")
  );
}

function isJsonParseError(error: unknown): boolean {
  return error instanceof SyntaxError && /json|unexpected token|unterminated/i.test(error.message);
}

function getFriendlyMessage(error: unknown): string {
  const code = getErrorCode(error);
  if (isJsonParseError(error)) {
    return "The server could not read an OpenClaw JSON file because its format is invalid.";
  }
  if (code === "ENOENT") {
    return "A required OpenClaw file is missing, so this page could not be loaded.";
  }
  if (code === "EACCES" || code === "EPERM") {
    return "The server does not have permission to read a required OpenClaw file.";
  }
  return "This page could not be loaded because the server encountered an unexpected error.";
}

function normalizeQueryValue(value: string, fallback: string): string {
  const normalized = value.trim();
  return truncate(normalized || fallback);
}

export function redirectToErrorPage(error: unknown, options: RedirectOptions): never {
  if (isNextControlFlowError(error)) throw error;

  const params = new URLSearchParams({
    message: getFriendlyMessage(error),
    details: normalizeQueryValue(getErrorMessage(error), "No additional details were provided."),
    context: normalizeQueryValue(options.context, "loading this page"),
    retry: options.retryPath,
  });

  redirect(`/error?${params.toString()}`);
}

export function loadOrRedirectOnError<T>(loader: () => T, options: RedirectOptions): T {
  try {
    return loader();
  } catch (error) {
    return redirectToErrorPage(error, options);
  }
}
