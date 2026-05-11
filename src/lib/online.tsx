import { createContext, useContext, useState, type ReactNode } from "react";

const Ctx = createContext<{ online: boolean; setOnline: (v: boolean) => void }>({
  online: true,
  setOnline: () => {},
});

export function OnlineProvider({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState(true);
  return <Ctx.Provider value={{ online, setOnline }}>{children}</Ctx.Provider>;
}

export const useOnline = () => useContext(Ctx);
