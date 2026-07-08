import { cache } from "react";
import { getAccountSettingsAction } from "@/actions/settings";

export const getCachedAccountSettings = cache(async () => {
  return getAccountSettingsAction();
});
