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
  telegram?: string;
  lastLoginAt: string;
  createdAt: string;
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"info" | "security">("info");
  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
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
        // Пользователь не авторизован
        router.push("/login");
      } else {
        // Другие ошибки (403, 404, 500...)
        const errorData = await response.json().catch(() => ({}));
        console.warn("Проблема с получением данных пользователя:", errorData.message || `Status: ${response.status}`);
        router.push("/login");
      }
    } catch (error) {
      console.warn("Ошибка соединения при получении данных пользователя:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setNotification(null);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(passwordData),
      });

      const data = await response.json();

      if (response.ok) {
        setNotification({
          type: "success",
          message: "Пароль успешно изменен!",
        });
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setNotification({
          type: "error",
          message: data.error || "Ошибка при смене пароля",
        });
      }
    } catch (error) {
      setNotification({
        type: "error",
        message: "Произошла ошибка. Попробуйте еще раз.",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRoleName = (role: string) => {
    const roleMap: Record<string, string> = {
      ADMIN: "Администратор",
      USER: "Пользователь",
      MODERATOR: "Модератор",
    };
    return roleMap[role] || role;
  };

  const getStatusName = (status: string) => {
    const statusMap: Record<string, string> = {
      APPROVED: "Подтвержден",
      PENDING: "На рассмотрении",
      BLOCKED: "Заблокирован",
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      APPROVED: "bg-green-500/15 text-green-700 dark:bg-green-500/30 dark:text-green-300",
      PENDING: "bg-yellow-500/15 text-yellow-700 dark:bg-yellow-500/30 dark:text-yellow-300",
      BLOCKED: "bg-red-500/15 text-red-700 dark:bg-red-500/30 dark:text-red-300",
    };
    return colorMap[status] || "bg-black/10 dark:bg-white/20 text-black/70 dark:text-white/70";
  };

  const getRoleColor = (role: string) => {
    const colorMap: Record<string, string> = {
      ADMIN: "bg-purple-500/15 text-purple-700 dark:bg-purple-500/30 dark:text-purple-300",
      USER: "bg-blue-500/15 text-blue-700 dark:bg-blue-500/30 dark:text-blue-300",
      MODERATOR: "bg-indigo-500/15 text-indigo-700 dark:bg-indigo-500/30 dark:text-indigo-300",
    };
    return colorMap[role] || "bg-black/10 dark:bg-white/20 text-black/70 dark:text-white/70";
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-56px)] bg-white dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500/30 border-t-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-56px)] bg-white dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-black/90 dark:text-white/90 mb-2">
            Пользователь не найден
          </h1>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            Вернуться к входу
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-56px)] bg-white dark:bg-[#0a0a0a]">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Навигация */}
        <div className="mb-6">
          <Link
            href="/overview"
            className="inline-flex items-center gap-1.5 text-sm text-black/60 dark:text-white/60 hover:text-black/80 dark:hover:text-white/80 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Назад к документации
          </Link>
        </div>

        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-black/90 dark:text-white/90 mb-2">
            Профиль пользователя
          </h1>
          <p className="text-black/60 dark:text-white/60">
            Управляйте настройками вашего аккаунта и безопасностью
          </p>
        </div>

        {/* Информация о пользователе */}
        <div className="mb-8 p-6 border border-black/5 dark:border-white/10 rounded-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-black/90 dark:text-white/90 mb-1">
                {user.name}
              </h2>
              <p className="text-black/70 dark:text-white/70 mb-3">{user.email}</p>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(
                    user.status
                  )}`}
                >
                  {getStatusName(user.status)}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getRoleColor(
                    user.role
                  )}`}
                >
                  {getRoleName(user.role)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Табы */}
        <div className="mb-6">
          <div className="border-b border-black/5 dark:border-white/10">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab("info")}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "info"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-black/60 dark:text-white/60 hover:text-black/80 dark:hover:text-white/80"
                }`}
              >
                Информация
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "security"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-black/60 dark:text-white/60 hover:text-black/80 dark:hover:text-white/80"
                }`}
              >
                Безопасность
              </button>
            </nav>
          </div>
        </div>

        {/* Содержимое табов */}
        {activeTab === "info" && (
          <div className="space-y-6">
            {/* Основная информация */}
            <div className="p-6 border border-black/5 dark:border-white/10 rounded-lg">
              <h3 className="text-lg font-semibold text-black/90 dark:text-white/90 mb-4">
                Основная информация
              </h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-black/60 dark:text-white/60 mb-1">
                    Имя пользователя
                  </dt>
                  <dd className="text-sm text-black/90 dark:text-white/90">
                    {user.name}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-black/60 dark:text-white/60 mb-1">
                    Email адрес
                  </dt>
                  <dd className="text-sm text-black/90 dark:text-white/90">
                    {user.email}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-black/60 dark:text-white/60 mb-1">
                    Роль в системе
                  </dt>
                  <dd className="text-sm text-black/90 dark:text-white/90">
                    {getRoleName(user.role)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-black/60 dark:text-white/60 mb-1">
                    Статус аккаунта
                  </dt>
                  <dd>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(
                        user.status
                      )}`}
                    >
                      {getStatusName(user.status)}
                    </span>
                  </dd>
                </div>
                {user.telegram && (
                  <div>
                    <dt className="text-sm font-medium text-black/60 dark:text-white/60 mb-1">
                      Telegram
                    </dt>
                    <dd className="text-sm text-black/90 dark:text-white/90">
                      {user.telegram}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-black/60 dark:text-white/60 mb-1">
                    Дата регистрации
                  </dt>
                  <dd className="text-sm text-black/90 dark:text-white/90">
                    {formatDate(user.createdAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-black/60 dark:text-white/60 mb-1">
                    Последний вход
                  </dt>
                  <dd className="text-sm text-black/90 dark:text-white/90">
                    {user.lastLoginAt ? formatDate(user.lastLoginAt) : "Никогда"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-black/60 dark:text-white/60 mb-1">
                    ID пользователя
                  </dt>
                  <dd className="text-sm">
                    <code className="bg-black/5 dark:bg-white/10 px-2 py-1 rounded text-xs font-mono text-black/80 dark:text-white/80">
                      {user.id}
                    </code>
                  </dd>
                </div>
              </dl>
            </div>

            {/* Быстрые действия */}
            {user.role === "ADMIN" && (
              <div className="p-6 border border-black/5 dark:border-white/10 rounded-lg">
                <h3 className="text-lg font-semibold text-black/90 dark:text-white/90 mb-4">
                  Административные функции
                </h3>
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 dark:bg-purple-500/20 hover:bg-purple-500/20 dark:hover:bg-purple-500/30 text-purple-600 dark:text-purple-400 rounded-md transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Перейти в админ-панель
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-6">
            {/* Смена пароля */}
            <div className="p-6 border border-black/5 dark:border-white/10 rounded-lg">
              <h3 className="text-lg font-semibold text-black/90 dark:text-white/90 mb-4">
                Смена пароля
              </h3>
              <p className="text-sm text-black/60 dark:text-white/60 mb-6">
                Обновите свой пароль для обеспечения безопасности аккаунта
              </p>

              {notification && (
                <div
                  className={`mb-4 p-3 rounded-md text-sm ${
                    notification.type === "success"
                      ? "bg-green-500/15 text-green-700 dark:bg-green-500/30 dark:text-green-300"
                      : "bg-red-500/15 text-red-700 dark:bg-red-500/30 dark:text-red-300"
                  }`}
                >
                  {notification.message}
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black/70 dark:text-white/80 mb-2">
                    Текущий пароль
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, currentPassword: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-black/10 dark:border-white/10 rounded-md bg-transparent text-black/90 dark:text-white/90 text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black/70 dark:text-white/80 mb-2">
                    Новый пароль
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-black/10 dark:border-white/10 rounded-md bg-transparent text-black/90 dark:text-white/90 text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                    minLength={6}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black/70 dark:text-white/80 mb-2">
                    Подтвердите новый пароль
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-black/10 dark:border-white/10 rounded-md bg-transparent text-black/90 dark:text-white/90 text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                    minLength={6}
                    required
                  />
                </div>
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white text-sm font-medium rounded-md transition-colors disabled:cursor-not-allowed"
                  >
                    {passwordLoading && (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                    )}
                    {passwordLoading ? "Обновление..." : "Обновить пароль"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}