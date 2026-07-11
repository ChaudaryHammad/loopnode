import { prisma } from "@/lib/prisma";
import { resolveClientLocation, type IpLocation } from "@/lib/ip-geolocation";

function signupFields(location: IpLocation) {
  return {
    signupIp: location.ip,
    signupCountry: location.country,
    signupCity: location.city,
    signupLat: location.lat,
    signupLng: location.lng,
  };
}

function lastLoginFields(location: IpLocation) {
  return {
    lastLoginIp: location.ip,
    lastLoginCountry: location.country,
    lastLoginCity: location.city,
    lastLoginLat: location.lat,
    lastLoginLng: location.lng,
    lastLoginAt: new Date(),
  };
}

export async function captureSignupLocation(userId: string): Promise<void> {
  const location = await resolveClientLocation();
  if (!location) return;

  await prisma.user.update({
    where: { id: userId },
    data: signupFields(location),
  });
}

export async function captureLoginLocation(userId: string): Promise<void> {
  const location = await resolveClientLocation();
  if (!location) return;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { signupLat: true, signupLng: true },
  });

  const backfillSignup =
    user != null && (user.signupLat == null || user.signupLng == null);

  await prisma.user.update({
    where: { id: userId },
    data: {
      ...lastLoginFields(location),
      ...(backfillSignup ? signupFields(location) : {}),
    },
  });
}
