export type ViewerRole = "admin" | "user" | null | undefined;

export function canViewInternalCatalogData(role: ViewerRole): boolean {
  return role === "admin";
}
