import { isGoogleAuthEnabled } from "@/lib/google-auth";
import { RegisterPageClient } from "./register-client";

export default function RegisterPage() {
  return <RegisterPageClient googleEnabled={isGoogleAuthEnabled()} />;
}
