import { isGoogleAuthEnabled } from "@/lib/google-auth";
import { LoginPageClient } from "./login-client";

export default function LoginPage() {
  return <LoginPageClient googleEnabled={isGoogleAuthEnabled()} />;
}
