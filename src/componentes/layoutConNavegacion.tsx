"use client";

import { usePathname } from "next/navigation";
import BarraNavegacion from "@/componentes/barraNavegacion";

type Props = {
  children: React.ReactNode;
};

export default function LayoutConNavegacion({ children }: Props) {
  const pathname = usePathname();

  const ocultarBarra = pathname === "/login";

  return (
    <>
      {!ocultarBarra && <BarraNavegacion />}
      <div className="flex-1">{children}</div>
    </>
  );
}