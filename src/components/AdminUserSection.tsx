"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

export default function AdminUserSection() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else if (response.status === 401) {
        // Пользователь не авторизован - это нормальное состояние
        setUser(null);
      } else {
        // Другие ошибки (403, 404, 500...)
        const errorData = await response.json().catch(() => ({}));
        console.warn("Проблема с получением данных пользователя:", errorData.message || `Status: ${response.status}`);
        setUser(null);
      }
    } catch (error) {
      console.warn("Ошибка соединения при получении данных пользователя:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error("Ошибка при выходе:", error);
      // В случае ошибки все равно перенаправляем на логин
      router.push("/login");
    }
  };

  if (loading) {
    return (
      <div className="border-t border-black/5 dark:border-white/10 p-3 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-sm">
        <div className="animate-pulse">
          <div className="h-4 bg-[#171717]/10 dark:bg-[#ededed]/20 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-[#171717]/10 dark:bg-[#ededed]/20 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="border-t border-black/5 dark:border-white/10 p-3 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-sm">
      {/* Информация о пользователе */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-[#171717] dark:text-[#ededed] truncate">
              {user.name}
            </div>
          </div>
          {user.role === "ADMIN" && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-500/15 text-purple-700 dark:bg-purple-500/30 dark:text-purple-300">
              Admin
            </span>
          )}
        </div>
        <div className="text-xs text-[#171717]/60 dark:text-[#ededed]/60 truncate ml-8">
          {user.email}
        </div>
      </div>

      {/* Кнопки действий */}
      <div className="space-y-2">
        {/* Кнопка возврата к документации (аналог админ-панели) */}
        <Link
          href="/overview"
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-500/20 hover:bg-blue-500/20 dark:hover:bg-blue-500/30 rounded-md transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          К документации
        </Link>
        
        {/* Основные кнопки */}
        <div className="flex gap-2">
          <Link
            href="/profile"
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-[#171717]/70 dark:text-[#ededed]/80 bg-[#171717]/5 dark:bg-[#ededed]/10 hover:bg-[#171717]/10 dark:hover:bg-[#ededed]/20 rounded-md transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Профиль
          </Link>
          <button
            onClick={handleLogout}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 bg-red-500/10 dark:bg-red-500/20 hover:bg-red-500/20 dark:hover:bg-red-500/30 rounded-md transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Выход
          </button>
        </div>
      </div>
    </div>
  );
}

