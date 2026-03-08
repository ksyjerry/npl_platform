export const PERMISSIONS = {
  "pool:write": ["admin", "accountant"],
  "pool:read_detail": ["admin", "accountant", "seller", "buyer"],
  "document:seller:write": ["admin", "accountant", "seller"],
  "document:buyer:write": ["admin", "accountant", "buyer"],
  "document:accountant:write": ["admin", "accountant"],
  "document:seller:read": ["admin", "accountant", "seller"],
  "document:buyer:read": ["admin", "accountant", "buyer"],
  "document:accountant:read": ["admin", "accountant"],
  "notice:write": ["admin", "accountant"],
  "notice:create": ["admin", "accountant"],
  "notice:edit": ["admin", "accountant"],
  "notice:delete": ["admin", "accountant"],
  "admin:access": ["admin"],
  "consulting:reply": ["admin", "accountant"],
  "consulting:view": ["admin", "accountant", "seller", "buyer"],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export const can = (role: string, permission: Permission): boolean =>
  (PERMISSIONS[permission] as readonly string[]).includes(role);
