"use client";

import { useCallback, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Loader2, Trash2, UserRound } from "lucide-react";
import {
  changePasswordSchema,
  deleteAccountSchema,
  updateProfileSchema,
} from "@/lib/validations/settings";
import {
  changePasswordAction,
  deleteAccountAction,
  updateProfileAction,
} from "@/actions/settings";
import { useAutoDismiss } from "@/hooks/use-auto-dismiss";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProfileSettingsFormProps {
  user: {
    name: string | null;
    email: string;
  };
}

export function ProfileSettingsForm({ user }: ProfileSettingsFormProps) {
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isProfilePending, startProfileTransition] = useTransition();
  const [isPasswordPending, startPasswordTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();

  const clearProfileFeedback = useCallback(() => {
    setProfileMessage(null);
    setProfileError(null);
  }, []);
  const clearPasswordFeedback = useCallback(() => {
    setPasswordMessage(null);
    setPasswordError(null);
  }, []);
  const clearDeleteFeedback = useCallback(() => {
    setDeleteError(null);
  }, []);

  useAutoDismiss(profileMessage, clearProfileFeedback);
  useAutoDismiss(profileError, clearProfileFeedback);
  useAutoDismiss(passwordMessage, clearPasswordFeedback);
  useAutoDismiss(passwordError, clearPasswordFeedback);
  useAutoDismiss(deleteError, clearDeleteFeedback);

  const profileForm = useForm({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: user.name ?? "" },
  });

  const passwordForm = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const deleteForm = useForm({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: { confirmEmail: "" },
  });

  const onProfileSubmit = profileForm.handleSubmit((data) => {
    setProfileMessage(null);
    setProfileError(null);
    startProfileTransition(async () => {
      const res = await updateProfileAction(data);
      if (res.success) {
        setProfileMessage(res.message ?? "Profile updated.");
      } else {
        setProfileError(res.error ?? "Failed to update profile.");
      }
    });
  });

  const onPasswordSubmit = passwordForm.handleSubmit((data) => {
    setPasswordMessage(null);
    setPasswordError(null);
    startPasswordTransition(async () => {
      const res = await changePasswordAction(data);
      if (res.success) {
        setPasswordMessage(res.message ?? "Password updated.");
        passwordForm.reset();
      } else {
        setPasswordError(res.error ?? "Failed to change password.");
      }
    });
  });

  const onDeleteSubmit = deleteForm.handleSubmit((data) => {
    if (
      !confirm(
        "This will permanently delete your account and all connected websites. This cannot be undone."
      )
    ) {
      return;
    }

    setDeleteError(null);
    startDeleteTransition(async () => {
      const res = await deleteAccountAction(data);
      if (!res.success) {
        setDeleteError(res.error ?? "Failed to delete account.");
      }
    });
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/30">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <UserRound className="size-5" />
              </div>
              <div className="space-y-1">
                <CardTitle>Display name</CardTitle>
                <CardDescription>
                  Shown across your dashboard and audit reports
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={onProfileSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  disabled={isProfilePending}
                  aria-invalid={!!profileForm.formState.errors.name}
                  {...profileForm.register("name")}
                />
                {profileForm.formState.errors.name && (
                  <p className="text-xs text-destructive">
                    {profileForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              {profileError && (
                <Alert variant="destructive">
                  <AlertDescription>{profileError}</AlertDescription>
                </Alert>
              )}
              {profileMessage && (
                <Alert>
                  <AlertDescription>{profileMessage}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" disabled={isProfilePending}>
                {isProfilePending && <Loader2 className="animate-spin" />}
                Save profile
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/30">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <KeyRound className="size-5" />
              </div>
              <div className="space-y-1">
                <CardTitle>Password</CardTitle>
                <CardDescription>Update your login credentials</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={onPasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  disabled={isPasswordPending}
                  {...passwordForm.register("currentPassword")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  disabled={isPasswordPending}
                  {...passwordForm.register("newPassword")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  disabled={isPasswordPending}
                  {...passwordForm.register("confirmPassword")}
                />
              </div>

              {passwordError && (
                <Alert variant="destructive">
                  <AlertDescription>{passwordError}</AlertDescription>
                </Alert>
              )}
              {passwordMessage && (
                <Alert>
                  <AlertDescription>{passwordMessage}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" disabled={isPasswordPending}>
                {isPasswordPending && <Loader2 className="animate-spin" />}
                Update password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-destructive/25 bg-destructive/5">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <Trash2 className="size-5" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-destructive">Delete account</CardTitle>
              <CardDescription>
                Permanently remove your profile, connected websites, and all audit history.
                This action cannot be undone.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={onDeleteSubmit} className="max-w-md space-y-4">
            <div className="space-y-2">
              <Label htmlFor="confirmEmail">Type your email to confirm</Label>
              <Input
                id="confirmEmail"
                type="email"
                placeholder={user.email}
                disabled={isDeletePending}
                {...deleteForm.register("confirmEmail")}
              />
              {deleteForm.formState.errors.confirmEmail && (
                <p className="text-xs text-destructive">
                  {deleteForm.formState.errors.confirmEmail.message}
                </p>
              )}
            </div>

            {deleteError && (
              <Alert variant="destructive">
                <AlertDescription>{deleteError}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" variant="destructive" disabled={isDeletePending}>
              {isDeletePending && <Loader2 className="animate-spin" />}
              Delete account permanently
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
