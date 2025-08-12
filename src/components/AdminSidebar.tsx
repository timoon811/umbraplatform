"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminUserSection from "./AdminUserSection";

// Организуем навигацию по группам, как в пользовательском сайдбаре
const navigationSections = [
  {
    title: "ПАНЕЛЬ УПРАВЛЕНИЯ",
    items: [
      {
        name: "Обзор",
        href: "/admin",
      },
    ],
  },
  {
    title: "УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ",
    items: [
      {
        name: "Все пользователи",
        href: "/admin/users",
      },
    ],
  },
  {
    title: "КОНТЕНТ",
    items: [
      {
        name: "Все статьи",
        href: "/admin/articles",
      },
      {
        name: "Создать статью",
        href: "/admin/articles/new",
      },
      {
        name: "Категории",
        href: "/admin/articles/categories",
      },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="sidebar-column hidden lg:flex lg:flex-col border-r border-black/5 dark:border-white/10 sticky top-14 h-[calc(100vh-56px)] overflow-hidden">
      {/* Навигационная область (скроллируемая) */}
      <div className="flex-1 overflow-y-auto p-6">
        <nav className="text-sm leading-6">
          {navigationSections.map((section, sectionIndex) => (
            <div key={`section-${section.title}-${sectionIndex}`} className="mb-6">
              <div className="nav-section-title">
                {section.title}
              </div>
              <ul className="space-y-1">
                {section.items.map((item, itemIndex) => {
                  const active = isActive(item.href);
                  return (
                    <li key={`${section.title}-${item.href}-${itemIndex}`}>
                      <Link 
                        href={item.href} 
                        className={`nav-item ${active ? 'active' : ''}`}
                      >
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* Пользовательская секция (фиксированная снизу) */}
      <div className="flex-shrink-0">
        <AdminUserSection />
      </div>
    </aside>
  );
}

