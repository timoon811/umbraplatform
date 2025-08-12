import { prisma } from "@/lib/prisma";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import CopyButton from "@/components/CopyButton";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolink from "rehype-autolink-headings";

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug: slugArray } = await params;
  const slug = slugArray.join("/");
  
  // Сначала пытаемся найти в базе данных
  const article = await prisma.article.findFirst({
    where: {
      slug: slug,
      status: "PUBLISHED",
    },
  });

  if (!article) {
    notFound();
  }

  // Увеличиваем счетчик просмотров
  await prisma.article.update({
    where: { id: article.id },
    data: { viewCount: { increment: 1 } },
  });

  return (
    <div>
      <div className="mb-8">
        <div className="text-xs uppercase tracking-wide text-blue-700 dark:text-blue-400 mb-2">
          {getCategoryDisplayName(article.category)}
        </div>
        <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
        {article.excerpt && (
          <p className="text-lg text-black/70 dark:text-white/70 mb-6">
            {article.excerpt}
          </p>
        )}
      </div>

      <MDXRemote
        source={article.content}
        components={{
          pre: ({ children }) => {
            const code = typeof children === "string" ? children : (children as React.ReactElement)?.props?.children ?? "";
            return (
              <div className="relative group">
                <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <CopyButton text={String(code)} />
                </div>
                <pre>{children}</pre>
              </div>
            );
          },
        }}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm],
            rehypePlugins: [rehypeSlug, [rehypeAutolink, { behavior: "wrap" }]],
          },
        }}
      />

      <div className="mt-12 pt-8 border-t border-black/10 dark:border-white/10">
        <div className="flex items-center justify-between text-sm text-black/60 dark:text-white/60">
          <span>Просмотров: {article.viewCount}</span>
          <span>Обновлено: {new Date(article.updatedAt).toLocaleDateString("ru-RU")}</span>
        </div>
      </div>
    </div>
  );
}

function getCategoryDisplayName(category: string): string {
  const categoryMap: Record<string, string> = {
    "getting-started": "НАЧАЛО РАБОТЫ",
    "api": "API REFERENCE V2",
    "cms-modules": "МОДУЛИ ДЛЯ CMS",
    "forms-buttons": "ФОРМЫ И КНОПКИ",
  };
  return categoryMap[category] || category.toUpperCase();
}

export async function generateStaticParams() {
  const articles = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true },
  });

  return articles.map((article) => ({
    slug: article.slug.split("/"),
  }));
}
