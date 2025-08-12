import { prisma } from "./prisma";

export type NavItem = { title: string; href: string };
export type NavSection = { title: string; items: NavItem[] };

export async function getDocsNav(): Promise<NavSection[]> {
  const sections: NavSection[] = [];
  
  try {
    // Получаем категории и статьи из базы данных
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        articles: {
          where: { status: "PUBLISHED" },
          select: {
            title: true,
            slug: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { order: "asc" },
    });

    // Создаем секции навигации
    for (const category of categories) {
      if (category.articles.length > 0) {
        sections.push({
          title: category.name,
          items: category.articles.map(article => ({
            title: article.title,
            href: `/${article.slug}`,
          })),
        });
      }
    }

  } catch (error) {
    console.error("Error loading navigation from database:", error);
    // Возвращаем пустой массив при ошибке
    return [];
  }

  return sections;
}



export type TocItem = { depth: number; text: string; id: string };

// Функция для генерации ID аналогично rehype-slug с сохранением кириллицы
function generateSlugId(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Заменяем пробелы на дефисы
    .replace(/\s+/g, '-')
    // Убираем знаки препинания, но оставляем кириллицу, латиницу, цифры и дефисы
    .replace(/[^\u0400-\u04FFa-z0-9\-]/gi, '')
    // Убираем множественные дефисы
    .replace(/\-\-+/g, '-')
    // Убираем дефисы в начале и конце
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export function extractHeadingsForToc(content: string): TocItem[] {
  const lines = content.split(/\r?\n/);
  const items: TocItem[] = [];
  for (const line of lines) {
    const m = /^(#{2,3})\s+(.+)$/.exec(line);
    if (m) {
      const depth = m[1].length;
      const text = m[2].trim();
      const id = generateSlugId(text);
      items.push({ depth, text, id });
    }
  }
  return items;
}


