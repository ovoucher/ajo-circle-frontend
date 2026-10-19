import { createContext, useContext } from "react";
import type { RuntimeConfig } from "../lib/config";

const Ctx = createContext<RuntimeConfig | null>(null);
export const RuntimeConfigProvider = Ctx.Provider;

export function useRuntimeConfig(): RuntimeConfig {
  const c = useContext(Ctx);
  if (!c) throw new Error("useRuntimeConfig must be used inside RuntimeConfigProvider");
  return c;
}
