"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SearchBox from "@/components/SearchBox";
import ThemeToggle from "@/components/ThemeToggle";
import UmbraLogo from "@/components/UmbraLogo";

export default function ConditionalNavigation() {
  const pathname = usePathname();
  
  // Не показываем навигацию на страницах аутентификации и в админ панели
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isAdminPage = pathname.startsWith("/admin");
  
  if (isAuthPage || isAdminPage) {
    return null;
  }

  return (
    <div className="sticky-topbar border-b border-black/5 dark:border-white/10">
      <div className="mx-auto max-w-screen-2xl px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <UmbraLogo size="sm" />
            Umbra Platform
          </Link>
          <span className="text-sm text-black/60 dark:text-white/60">Документация</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:block"><SearchBox /></div>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
