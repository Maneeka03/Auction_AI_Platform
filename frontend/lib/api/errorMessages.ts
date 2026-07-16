const ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "That email or password is incorrect.",
  account_locked: "This account is locked. Contact support to unlock it.",
  email_already_registered: "An account with this email already exists.",
  weak_password: "Choose a stronger password.",
  network_error: "Unable to reach the server. Check your connection.",
  timeout: "The request timed out. Please try again.",
  unknown_error: "Something went wrong. Please try again.",
};

export function resolveErrorMessage(code: string, fallback?: string): string {
  return ERROR_MESSAGES[code] ?? fallback ?? ERROR_MESSAGES.unknown_error;
}