"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import { extractHeadingsForToc } from "@/lib/docs";
import { useModal } from "@/hooks/useModal";
import AlertModal from "@/components/modals/AlertModal";
import ConfirmModal from "@/components/modals/ConfirmModal";
import ModernArticleEditor from "@/components/editor/ModernArticleEditor";

// Типы данных
interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  category: string;
  tags: string[];
  metaTitle: string;
  metaDescription: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  viewCount: number;
  likeCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    comments: number;
    feedbacks: number;
  };
}

interface TocItem {
  depth: number;
  text: string;
  id: string;
}

// Компонент редактора статей
export default function ArticleEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const isNew = resolvedParams.id === "new";

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [tocItems, setTocItems] = useState<TocItem[]>([]);

  // Состояние формы
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    category: "getting-started",
    tags: [] as string[],
    metaTitle: "",
    metaDescription: "",
    status: "DRAFT" as "DRAFT" | "PUBLISHED" | "ARCHIVED",
  });

  const [tagInput, setTagInput] = useState("");
  const [useModernEditor, setUseModernEditor] = useState(false);
  
  // Modal hooks
  const { alertModal, confirmModal, success, error } = useModal();

  // Загрузка статьи для редактирования
  const loadArticle = async () => {
    if (isNew) return;

    try {
      const response = await fetch(`/api/admin/articles/${resolvedParams.id}`);
      if (response.ok) {
        const data: Article = await response.json();
        setArticle(data);
        setFormData({
          title: data.title,
          content: data.content,
          excerpt: data.excerpt || "",
          category: data.category,
          tags: data.tags || [],
          metaTitle: data.metaTitle || "",
          metaDescription: data.metaDescription || "",
          status: data.status,
        });
      } else {
        console.error("Failed to load article");
        router.push("/admin/articles");
      }
    } catch (error) {
      console.error("Error loading article:", error);
      router.push("/admin/articles");
    } finally {
      setLoading(false);
    }
  };

  // Автоматическое обновление TOC при изменении контента
  const updateToc = useCallback(() => {
    if (formData.content) {
      const headings = extractHeadingsForToc(formData.content);
      setTocItems(headings);
    } else {
      setTocItems([]);
    }
  }, [formData.content]);

  // Автоматическое создание excerpt из content
  const autoGenerateExcerpt = useCallback(() => {
    if (formData.content && !formData.excerpt) {
      const plainText = formData.content
        .replace(/#{1,6}\s+/g, "") // убираем заголовки
        .replace(/\*\*(.*?)\*\*/g, "$1") // убираем жирный
        .replace(/\*(.*?)\*/g, "$1") // убираем курсив
        .replace(/`(.*?)`/g, "$1") // убираем код
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // убираем ссылки
        .replace(/\n+/g, " ") // убираем переносы
        .trim();
      
      const excerpt = plainText.substring(0, 160);
      setFormData(prev => ({ ...prev, excerpt }));
    }
  }, [formData.content, formData.excerpt]);

  // Автоматическое создание metaTitle из title
  const autoGenerateMetaTitle = useCallback(() => {
    if (formData.title && !formData.metaTitle) {
      setFormData(prev => ({ ...prev, metaTitle: formData.title }));
    }
  }, [formData.title, formData.metaTitle]);

  // Сохранение статьи
  const saveArticle = async (newStatus?: string) => {
    setSaving(true);
    try {
      const method = isNew ? "POST" : "PUT";
      const url = isNew ? "/api/admin/articles" : `/api/admin/articles/${resolvedParams.id}`;
      
      const payload = {
        ...formData,
        status: newStatus || formData.status,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const savedArticle: Article = await response.json();
        if (isNew) {
          router.push(`/admin/articles/${savedArticle.id}`);
        } else {
          setArticle(savedArticle);
          setFormData({
            title: savedArticle.title,
            content: savedArticle.content,
            excerpt: savedArticle.excerpt || "",
            category: savedArticle.category,
            tags: savedArticle.tags || [],
            metaTitle: savedArticle.metaTitle || "",
            metaDescription: savedArticle.metaDescription || "",
            status: savedArticle.status,
          });
        }
      } else {
        const errorData = await response.json();
        error(errorData.error || "Неизвестная ошибка", "Ошибка сохранения");
      }
    } catch {
      error("Ошибка сохранения статьи");
    } finally {
      setSaving(false);
    }
  };

  // Добавление тега
  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  // Удаление тега
  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Обработка Enter в поле тега
  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  // Эффекты
  useEffect(() => {
    loadArticle();
  }, []);

  useEffect(() => {
    updateToc();
  }, [updateToc]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      autoGenerateExcerpt();
      autoGenerateMetaTitle();
    }, 1000);

    return () => clearTimeout(debounceTimer);
  }, [autoGenerateExcerpt, autoGenerateMetaTitle]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#171717]/60 dark:text-[#ededed]/60">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Заголовок и кнопки действий */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#171717] dark:text-[#ededed]">
            {isNew ? "Создание статьи" : "Редактирование статьи"}
          </h1>
          {article && (
            <p className="text-sm text-[#171717]/60 dark:text-[#ededed]/60 mt-1">
              Создано: {new Date(article.createdAt).toLocaleString()} | 
              Обновлено: {new Date(article.updatedAt).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => router.push("/admin/articles")}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            ← Назад
          </button>
          {!isNew && (
            <a
              href={`/${article?.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              👁️ Просмотр
            </a>
          )}
          <button
            onClick={() => setUseModernEditor(!useModernEditor)}
            className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
              useModernEditor 
                ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-600'
                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {useModernEditor ? "📝 Classic Editor" : "✨ Modern Editor"}
          </button>
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {previewMode ? "📝 Редактировать" : "👁️ Превью"}
          </button>
          <button
            onClick={() => saveArticle("DRAFT")}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            {saving ? "Сохранение..." : "💾 Сохранить"}
          </button>
          <button
            onClick={() => saveArticle("PUBLISHED")}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? "Публикация..." : "🚀 Опубликовать"}
          </button>
        </div>
      </div>

      {/* Основной контент */}
      {useModernEditor ? (
        <ModernArticleEditor
          initialData={{
            title: formData.title,
            description: formData.excerpt,
            blocks: formData.content ? [{ id: '1', type: 'paragraph', content: formData.content }] : [{ id: '1', type: 'paragraph', content: '' }],
            category: formData.category,
            tags: formData.tags,
            status: formData.status
          }}
          onSave={async (data) => {
            const updatedFormData = {
              ...formData,
              title: data.title,
              excerpt: data.description,
              content: data.blocks.map(b => b.content).join('\n\n'),
              category: data.category,
              tags: data.tags,
              status: data.status
            };
            setFormData(updatedFormData);
            await saveArticle(data.status);
          }}
          isNew={isNew}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Главная форма (3 колонки) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Основная информация */}
          <div className="bg-white dark:bg-[#0a0a0a] rounded-lg border border-[#171717]/5 dark:border-[#ededed]/10 p-6">
            <h2 className="text-lg font-semibold text-[#171717] dark:text-[#ededed] mb-4">
              Основная информация
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                  Заголовок *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed]"
                  placeholder="Введите заголовок статьи..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                  Краткое описание
                </label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed]"
                  placeholder="Краткое описание статьи (автоматически генерируется из контента)..."
                />
              </div>
            </div>
          </div>

          {/* Контент */}
          <div className="bg-white dark:bg-[#0a0a0a] rounded-lg border border-[#171717]/5 dark:border-[#ededed]/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#171717] dark:text-[#ededed]">
                Содержимое
              </h2>
              <span className="text-xs text-[#171717]/60 dark:text-[#ededed]/60">
                Markdown поддерживается
              </span>
            </div>
            
            {previewMode ? (
              <div className="min-h-[400px] p-4 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900">
                <div className="prose dark:prose-invert max-w-none">
                  {/* Здесь должен быть MDX рендер, пока просто отображаем как есть */}
                  <pre className="whitespace-pre-wrap font-sans text-sm">
                    {formData.content}
                  </pre>
                </div>
              </div>
            ) : (
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={20}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] font-mono text-sm"
                placeholder="# Введите содержимое статьи в формате Markdown

## Заголовок второго уровня

Обычный текст с **жирным** и *курсивом*.

- Список
- Элементов

```javascript
const code = 'example';
```

[Ссылка](https://example.com)"
              />
            )}
          </div>
        </div>

        {/* Боковая панель (1 колонка) */}
        <div className="space-y-6">
          {/* Публикация */}
          <div className="bg-white dark:bg-[#0a0a0a] rounded-lg border border-[#171717]/5 dark:border-[#ededed]/10 p-4">
            <h3 className="text-sm font-semibold text-[#171717] dark:text-[#ededed] mb-3">
              Публикация
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#171717] dark:text-[#ededed] mb-1">
                  Статус
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed]"
                >
                  <option value="DRAFT">Черновик</option>
                  <option value="PUBLISHED">Опубликовано</option>
                  <option value="ARCHIVED">Архив</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#171717] dark:text-[#ededed] mb-1">
                  Категория *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed]"
                >
                  <option value="getting-started">Начало работы</option>
                  <option value="api">API Reference</option>
                  <option value="cms-modules">Модули CMS</option>
                  <option value="forms-buttons">Формы и кнопки</option>
                </select>
              </div>
            </div>
          </div>

          {/* Теги */}
          <div className="bg-white dark:bg-[#0a0a0a] rounded-lg border border-[#171717]/5 dark:border-[#ededed]/10 p-4">
            <h3 className="text-sm font-semibold text-[#171717] dark:text-[#ededed] mb-3">
              Теги
            </h3>
            
            <div className="space-y-2">
              <div className="flex gap-1">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagKeyPress}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed]"
                  placeholder="Новый тег..."
                />
                <button
                  onClick={addTag}
                  className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  +
                </button>
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:text-red-600 dark:hover:text-red-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* TOC */}
          {tocItems.length > 0 && (
            <div className="bg-white dark:bg-[#0a0a0a] rounded-lg border border-[#171717]/5 dark:border-[#ededed]/10 p-4">
              <h3 className="text-sm font-semibold text-[#171717] dark:text-[#ededed] mb-3">
                На этой странице
              </h3>
              
              <div className="space-y-1">
                {tocItems.map((item, index) => (
                  <div
                    key={index}
                    className={`text-xs text-[#171717]/70 dark:text-[#ededed]/70 ${
                      item.depth === 3 ? "ml-3" : ""
                    }`}
                  >
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SEO */}
          <div className="bg-white dark:bg-[#0a0a0a] rounded-lg border border-[#171717]/5 dark:border-[#ededed]/10 p-4">
            <h3 className="text-sm font-semibold text-[#171717] dark:text-[#ededed] mb-3">
              SEO настройки
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#171717] dark:text-[#ededed] mb-1">
                  Meta заголовок
                </label>
                <input
                  type="text"
                  value={formData.metaTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, metaTitle: e.target.value }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed]"
                  placeholder="Автоматически из заголовка..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#171717] dark:text-[#ededed] mb-1">
                  Meta описание
                </label>
                <textarea
                  value={formData.metaDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, metaDescription: e.target.value }))}
                  rows={3}
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed]"
                  placeholder="Описание для поисковых систем..."
                />
              </div>
            </div>
          </div>

          {/* Статистика */}
          {article && (
            <div className="bg-white dark:bg-[#0a0a0a] rounded-lg border border-[#171717]/5 dark:border-[#ededed]/10 p-4">
              <h3 className="text-sm font-semibold text-[#171717] dark:text-[#ededed] mb-3">
                Статистика
              </h3>
              
              <div className="space-y-2 text-xs text-[#171717]/70 dark:text-[#ededed]/70">
                <div>👀 {article.viewCount} просмотров</div>
                <div>👍 {article.likeCount} лайков</div>
                <div>💬 {article._count.comments} комментариев</div>
                <div>📊 {article._count.feedbacks} отзывов</div>
              </div>
            </div>
          )}
        </div>
      </div>
      )}
      
      {/* Alert and Confirm Modals */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={alertModal.onClose}
        title={alertModal.options.title}
        message={alertModal.options.message}
        type={alertModal.options.type}
        confirmText={alertModal.options.confirmText}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={confirmModal.onClose}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.options.title}
        message={confirmModal.options.message}
        confirmText={confirmModal.options.confirmText}
        cancelText={confirmModal.options.cancelText}
        type={confirmModal.options.type}
        actionType={confirmModal.options.actionType}
      />
    </div>
  );
}
