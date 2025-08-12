import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "umbra_platform_super_secret_jwt_key_2024";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Валидация входных данных
    if (!email || !password) {
      return NextResponse.json(
        { message: "Email и пароль обязательны" },
        { status: 400 }
      );
    }

    // Поиск пользователя
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Неверный email или пароль" },
        { status: 401 }
      );
    }

    // Проверка статуса пользователя
    if (user.status === "BLOCKED") {
      return NextResponse.json(
        { message: "Аккаунт заблокирован" },
        { status: 403 }
      );
    }

    if (user.status === "PENDING") {
      return NextResponse.json(
        { message: "Аккаунт ожидает подтверждения администратора" },
        { status: 403 }
      );
    }

    if (user.status === "REJECTED") {
      return NextResponse.json(
        { message: "Регистрация отклонена администратором" },
        { status: 403 }
      );
    }

    // Проверка пароля
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { message: "Неверный email или пароль" },
        { status: 401 }
      );
    }

    // Создание JWT токена
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Обновление времени последнего входа
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Установка cookie
    const cookieStore = await cookies();
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 дней
    });

    // Логирование события входа
    await prisma.analytics.create({
      data: {
        event: "user_login",
        data: JSON.stringify({
          userId: user.id,
          email: user.email,
          userAgent: request.headers.get("user-agent"),
        }),
      },
    });

    return NextResponse.json({
      message: "Успешный вход",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Ошибка входа:", error);
    return NextResponse.json(
      { message: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
