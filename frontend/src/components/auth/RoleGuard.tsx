"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken, parseTokenPayload } from "@/lib/auth";
import { can, Permission } from "@/lib/rbac";

export default function RoleGuard({
  permission,
  children,
}: {
  permission: Permission;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }
    const payload = parseTokenPayload(token);
    if (!payload) {
      router.replace("/auth/login");
      return;
    }
    if (!can(payload.role as string, permission)) {
      router.replace("/");
      return;
    }
    setAuthorized(true);
  }, [permission, router]);

  if (!authorized) return null;
  return <>{children}</>;
}
