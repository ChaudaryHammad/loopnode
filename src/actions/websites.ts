"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { websiteSchema } from "@/lib/validations/website";
import { revalidatePath } from "next/cache";

export async function addWebsiteAction(values: any) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return { success: false, error: "Unauthorized. Please log in." };
  }

  const parsed = websiteSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { name, url, scanFrequency } = parsed.data;
  const userId = session.user.id;

  try {
    // Check if website URL already exists for this active user
    const existing = await prisma.website.findFirst({
      where: {
        userId,
        url: url.toLowerCase(),
        deletedAt: null,
      },
    });

    if (existing) {
      return { success: false, error: "You have already connected this website." };
    }

    // Create the website
    const website = await prisma.website.create({
      data: {
        name,
        url: url.toLowerCase(),
        scanFrequency,
        userId,
      },
    });

    // Create Audit Log
    await prisma.activityLog.create({
      data: {
        userId,
        action: "WEBSITE_CREATED",
        description: `Connected website "${name}" (${url})`,
        metadata: { websiteId: website.id },
      },
    });

    revalidatePath("/dashboard/websites");
    revalidatePath("/dashboard");

    return { success: true, data: website };
  } catch (error) {
    console.error("Add website error:", error);
    return { success: false, error: "Failed to add website. Please try again." };
  }
}

export async function editWebsiteAction(id: string, values: any) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return { success: false, error: "Unauthorized." };
  }

  const parsed = websiteSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { name, url, scanFrequency } = parsed.data;
  const userId = session.user.id;

  try {
    // Check ownership
    const website = await prisma.website.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
    });

    if (!website) {
      return { success: false, error: "Website not found or access denied." };
    }

    // Update website details
    const updated = await prisma.website.update({
      where: { id },
      data: {
        name,
        url: url.toLowerCase(),
        scanFrequency,
      },
    });

    // Create Audit Log
    await prisma.activityLog.create({
      data: {
        userId,
        action: "WEBSITE_UPDATED",
        description: `Updated website "${name}" (${url})`,
        metadata: { websiteId: id },
      },
    });

    revalidatePath("/dashboard/websites");
    revalidatePath(`/dashboard/websites/${id}`);
    revalidatePath("/dashboard");

    return { success: true, data: updated };
  } catch (error) {
    console.error("Edit website error:", error);
    return { success: false, error: "Failed to update website." };
  }
}

export async function deleteWebsiteAction(id: string) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return { success: false, error: "Unauthorized." };
  }

  const userId = session.user.id;

  try {
    // Check ownership
    const website = await prisma.website.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
    });

    if (!website) {
      return { success: false, error: "Website not found or access denied." };
    }

    // Perform soft delete
    const deleted = await prisma.website.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    // Create Audit Log
    await prisma.activityLog.create({
      data: {
        userId,
        action: "WEBSITE_DELETED",
        description: `Soft-deleted website "${website.name}"`,
        metadata: { websiteId: id },
      },
    });

    revalidatePath("/dashboard/websites");
    revalidatePath("/dashboard");

    return { success: true, message: `Successfully deleted website "${website.name}".` };
  } catch (error) {
    console.error("Delete website error:", error);
    return { success: false, error: "Failed to delete website." };
  }
}
