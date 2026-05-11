import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role = "super_admin" | "data_manager" | "ops_staff";

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  data_manager: "Data Manager / GIS Specialist",
  ops_staff: "Operational Staff",
};

type AuthState = {
  role: Role | null;
  name: string;
  login: (role: Role) => void;
  logout: () => void;
};

const Ctx = createContext<AuthState>({
  role: null,
  name: "",
  login: () => {},
  logout: () => {},
});

export function MockAuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);
  useEffect(() => {
    const saved = localStorage.getItem("ipms-role") as Role | null;
    if (saved) setRole(saved);
  }, []);
  const login = (r: Role) => {
    setRole(r);
    localStorage.setItem("ipms-role", r);
  };
  const logout = () => {
    setRole(null);
    localStorage.removeItem("ipms-role");
  };
  const name = role ? ROLE_LABELS[role] : "";
  return <Ctx.Provider value={{ role, name, login, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);

export type Action =
  | "records.edit"
  | "records.delete"
  | "users.manage"
  | "api.manage"
  | "audit.view"
  | "boundaries.edit"
  | "upload.commit"
  | "settings.manage";

export function can(role: Role | null, action: Action): boolean {
  if (!role) return false;
  if (role === "super_admin") return true;
  if (role === "data_manager") {
    return ["records.edit", "boundaries.edit", "upload.commit", "audit.view"].includes(action);
  }
  // ops_staff: read-only
  return false;
}
