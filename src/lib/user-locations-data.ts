import { prisma } from "@/lib/prisma";
import { isValidCoordinate, type WorldLocationPoint } from "@/lib/world-locations";

const userLocationSelect = {
  id: true,
  name: true,
  email: true,
  signupCountry: true,
  signupCity: true,
  signupLat: true,
  signupLng: true,
  lastLoginCountry: true,
  lastLoginCity: true,
  lastLoginLat: true,
  lastLoginLng: true,
  createdAt: true,
} as const;

type UserLocationRow = {
  signupCountry: string | null;
  signupCity: string | null;
  signupLat: number | null;
  signupLng: number | null;
  lastLoginCountry: string | null;
  lastLoginCity: string | null;
  lastLoginLat: number | null;
  lastLoginLng: number | null;
};

function usersWithMapCoordinatesWhere() {
  return {
    deletedAt: null,
    OR: [
      { AND: [{ signupLat: { not: null } }, { signupLng: { not: null } }] },
      { AND: [{ lastLoginLat: { not: null } }, { lastLoginLng: { not: null } }] },
    ],
  };
}

export function resolveUserMapLocation(user: UserLocationRow) {
  const hasSignup = isValidCoordinate(user.signupLat, user.signupLng);
  const hasLastLogin = isValidCoordinate(user.lastLoginLat, user.lastLoginLng);

  if (hasSignup) {
    return {
      lat: user.signupLat!,
      lng: user.signupLng!,
      city: user.signupCity,
      country: user.signupCountry,
      source: "signup" as const,
    };
  }

  if (hasLastLogin) {
    return {
      lat: user.lastLoginLat!,
      lng: user.lastLoginLng!,
      city: user.lastLoginCity,
      country: user.lastLoginCountry,
      source: "lastLogin" as const,
    };
  }

  return null;
}

export async function getPublicUserLocations(): Promise<WorldLocationPoint[]> {
  const users = await prisma.user.findMany({
    where: usersWithMapCoordinatesWhere(),
    select: {
      id: true,
      signupLat: true,
      signupLng: true,
      signupCity: true,
      signupCountry: true,
      lastLoginLat: true,
      lastLoginLng: true,
      lastLoginCity: true,
      lastLoginCountry: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return users.flatMap((user) => {
    const location = resolveUserMapLocation(user);
    if (!location) return [];

    const label = [location.city, location.country].filter(Boolean).join(", ");
    return [
      {
        id: user.id,
        lat: location.lat,
        lng: location.lng,
        label: label || undefined,
      },
    ];
  });
}

export async function getAdminUserLocations() {
  const users = await prisma.user.findMany({
    where: usersWithMapCoordinatesWhere(),
    select: userLocationSelect,
    orderBy: { createdAt: "desc" },
  });

  return users.flatMap((user) => {
    const location = resolveUserMapLocation(user);
    if (!location) return [];

    return [
      {
        id: user.id,
        name: user.name,
        email: user.email,
        signupCountry: location.country,
        signupCity: location.city,
        signupLat: location.lat,
        signupLng: location.lng,
        createdAt: user.createdAt,
      },
    ];
  });
}
