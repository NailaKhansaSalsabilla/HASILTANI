import type { ReactNode } from "react";
import { RoleShell } from "@/components/RoleShell";
export default function Layout({children}:{children:ReactNode}){return <RoleShell role="buyer">{children}</RoleShell>}
