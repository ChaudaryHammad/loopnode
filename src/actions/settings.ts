"use server";

import { auth, signOut } from "@/lib/auth";
import { deleteProfileImage, uploadProfileImage } from "@/lib/cloudinary";
import { getEntitlements } from "@/lib/entitlements";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import {
  changePasswordSchema,
  deleteAccountSchema,
  updateProfileSchema,
} from "@/lib/validations/settings";

const PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const PROFILE_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function revalidateProfilePaths() {
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard", "layout");
}

export async function updateProfileAction(values: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized." };
  }

  const parsed = updateProfileSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: parsed.data.name },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "PROFILE_UPDATED",
        description: "Updated profile name",
      },
    });

    revalidateProfilePaths();
    return { success: true, message: "Profile updated." };
  } catch (error) {
    console.error("Update profile error:", error);
    return { success: false, error: "Failed to update profile." };
  }
}

export async function changePasswordAction(values: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized." };
  }

  const parsed = changePasswordSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { currentPassword, newPassword } = parsed.data;

  try {
    const user = await prisma.user.findFirst({
      where: { id: session.user.id, deletedAt: null },
      select: { id: true, hashedPassword: true },
    });

    if (!user?.hashedPassword) {
      return {
        success: false,
        error: "Password login is not set up for this account.",
      };
    }

    const matches = await bcrypt.compare(currentPassword, user.hashedPassword);
    if (!matches) {
      return { success: false, error: "Current password is incorrect." };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { hashedPassword },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "PASSWORD_CHANGED",
        description: "Password changed from account settings",
      },
    });

    return { success: true, message: "Password updated successfully." };
  } catch (error) {
    console.error("Change password error:", error);
    return { success: false, error: "Failed to change password." };
  }
}

export async function deleteAccountAction(values: unknown) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return { success: false, error: "Unauthorized." };
  }

  const parsed = deleteAccountSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  if (parsed.data.confirmEmail.toLowerCase() !== session.user.email.toLowerCase()) {
    return { success: false, error: "Email does not match your account." };
  }

  const userId = session.user.id;

  try {
    try {
      await deleteProfileImage(userId);
    } catch (error) {
      console.warn("Cloudinary profile cleanup on account delete:", error);
    }

    const now = new Date();

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { deletedAt: now, image: null },
      }),
      prisma.website.updateMany({
        where: { userId, deletedAt: null },
        data: { deletedAt: now },
      }),
      prisma.activityLog.create({
        data: {
          userId,
          action: "ACCOUNT_DELETED",
          description: "User deleted their account",
        },
      }),
    ]);

    await signOut({ redirectTo: "/login" });
    return { success: true };
  } catch (error) {
    console.error("Delete account error:", error);
    return { success: false, error: "Failed to delete account." };
  }
}

export async function uploadProfileImageAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized." };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, error: "No image file provided." };
  }

  if (!PROFILE_IMAGE_TYPES.has(file.type)) {
    return {
      success: false,
      error: "Use a JPEG, PNG, or WebP image.",
    };
  }

  if (file.size > PROFILE_IMAGE_MAX_BYTES) {
    return { success: false, error: "Image must be 5 MB or smaller." };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadProfileImage(session.user.id, buffer, file.type);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: result.secure_url },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "PROFILE_IMAGE_UPDATED",
        description: "Updated profile photo",
      },
    });

    revalidateProfilePaths();
    return { success: true, imageUrl: result.secure_url, message: "Profile photo updated." };
  } catch (error) {
    console.error("Upload profile image error:", error);
    return { success: false, error: "Failed to upload profile photo." };
  }
}

export async function removeProfileImageAction() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized." };
  }

  try {
    await deleteProfileImage(session.user.id);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: null },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "PROFILE_IMAGE_REMOVED",
        description: "Removed profile photo",
      },
    });

    revalidateProfilePaths();
    return { success: true, message: "Profile photo removed." };
  } catch (error) {
    console.error("Remove profile image error:", error);
    return { success: false, error: "Failed to remove profile photo." };
  }
}

export async function getAccountSettingsAction() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized." };
  }

  const [user, entitlements] = await Promise.all([
    prisma.user.findFirst({
      where: { id: session.user.id, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        role: true,
        createdAt: true,
        image: true,
      },
    }),
    getEntitlements(session.user.id),
  ]);

  if (!user) {
    return { success: false, error: "Account not found." };
  }

  return {
    success: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      role: user.role,
      createdAt: user.createdAt,
      image: user.image,
      websiteCount: entitlements.websiteCount,
      websiteLimit: entitlements.websiteLimit,
      plan: entitlements.plan,
      planLabel: entitlements.planLabel,
      status: entitlements.status,
      isTrial: entitlements.isTrial,
      isReadOnly: entitlements.isReadOnly,
      trialEndsAt: entitlements.trialEndsAt,
      canScheduleScans: entitlements.canScheduleScans,
      canGenerateReports: entitlements.canGenerateReports,
      websitesRemaining: entitlements.websitesRemaining,
    },
  };
}
