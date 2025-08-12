import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/articles - Получение списка статей для админки
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const where: any = {};
    
    // Фильтры
    if (category) where.categoryKey = category;
    if (status) where.status = status;
    
    // Поиск
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
      ];
    }

    // Сортировка
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Получаем статьи с автором и счетчиками
    const articles = await prisma.article.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            comments: true,
            feedbacks: true,
          },
        },
      },
      orderBy,
      take: limit,
      skip: offset,
    });

    // Общее количество для пагинации
    const total = await prisma.article.count({ where });

    return NextResponse.json({
      articles: articles.map(article => ({
        ...article,
        tags: article.tags ? JSON.parse(article.tags) : [],
      })),
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error("Ошибка получения статей:", error);
    return NextResponse.json(
      { message: error.message || "Внутренняя ошибка сервера" },
      { status: error.message === "Не авторизован" ? 401 : 500 }
    );
  }
}

// POST /api/admin/articles - Создание новой статьи
export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin(request);

    const body = await request.json();
    const { 
      title, 
      content, 
      excerpt, 
      category, 
      tags, 
      metaTitle, 
      metaDescription,
      status = "DRAFT"
    } = body;

    // Валидация
    if (!title || !content || !category) {
      return NextResponse.json(
        { error: "Поля title, content и category обязательны" },
        { status: 400 }
      );
    }

    // Создаем slug из заголовка с поддержкой кириллицы
    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\u0400-\u04FFa-z0-9\-]/gi, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');

    // Проверяем уникальность slug и добавляем суффикс при необходимости
    let slug = baseSlug;
    let counter = 1;
    
    while (await prisma.article.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const article = await prisma.article.create({
      data: {
        title,
        slug,
        content,
        excerpt,
        categoryKey: category,
        tags: tags ? JSON.stringify(tags) : null,
        metaTitle,
        metaDescription,
        authorId: user.id,
        status,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            comments: true,
            feedbacks: true,
          },
        },
      },
    });

    return NextResponse.json({
      ...article,
      tags: article.tags ? JSON.parse(article.tags) : [],
    }, { status: 201 });
  } catch (error: any) {
    console.error("Ошибка создания статьи:", error);
    return NextResponse.json(
      { message: error.message || "Внутренняя ошибка сервера" },
      { status: error.message === "Не авторизован" ? 401 : 500 }
    );
  }
}
