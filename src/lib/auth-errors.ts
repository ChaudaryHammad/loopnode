/**
 * Maps Auth.js / OAuth error codes to user-facing messages.
 * @see https://authjs.dev/reference/core/errors
 */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  AccessDenied:
    "Google sign-in was cancelled or denied. Please try again.",
  Configuration:
    "Google sign-in is not configured correctly. Please contact support.",
  Verification:
    "The sign-in link is invalid or has expired. Please try again.",
  OAuthAccountNotLinked:
    "This Google account could not be linked. Sign in with your email and password, or try again.",
  AccountNotLinked:
    "This Google account is not linked to your profile. Sign in with your original method first.",
  OAuthCallback:
    "We couldn't complete Google sign-in. Please try again.",
  OAuthSignIn:
    "We couldn't start Google sign-in. Please try again.",
  Callback:
    "Authentication failed during the callback. Please try again.",
  EmailRequired:
    "Google did not provide an email address. Use an account with email access, or sign up with email.",
  EmailNotVerified:
    "Your Google email is not verified. Verify it with Google, then try again.",
  AccountDeleted:
    "This email belongs to a deleted account. Please contact support.",
  SessionRequired: "Please sign in to continue.",
  Default: "Something went wrong during sign-in. Please try again.",
};

export function getAuthErrorMessage(error: string | null | undefined): string {
  if (!error) return AUTH_ERROR_MESSAGES.Default;
  return AUTH_ERROR_MESSAGES[error] ?? AUTH_ERROR_MESSAGES.Default;
}
