import { tokenStore } from "./store/auth-store";

export function isAuthenticated(): boolean {
  return tokenStore.getAccess() !== null;
}
