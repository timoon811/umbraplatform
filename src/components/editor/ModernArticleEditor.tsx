"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Plus, X, Type, Image, List, Quote, Code, 
  Hash, AlignLeft, Bold, Italic, Link2, 
  Eye, Save, Settings, MessageSquare, 
  Clock, ChevronDown, MoreHorizontal,
  FileText, Heading1, Heading2, Heading3,
  Smile, ImageIcon, Layout, Play
} from 'lucide-react';
import BlockEditor, { Block } from './BlockEditor';

interface ArticleData {
  id?: string;
  title: string;
  description: string;
  icon?: string;
  cover?: string;
  blocks: Block[];
  category: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
}

interface ModernArticleEditorProps {
  initialData?: ArticleData;
  onSave?: (data: ArticleData) => void;
  onPreview?: (data: ArticleData) => void;
  isNew?: boolean;
}

export default function ModernArticleEditor({
  initialData,
  onSave,
  onPreview,
  isNew = false
}: ModernArticleEditorProps) {
  const [article, setArticle] = useState<ArticleData>(initialData || {
    title: '',
    description: '',
    blocks: [{ id: '1', type: 'paragraph', content: '' }],
    category: 'getting-started',
    tags: [],
    status: 'draft'
  });

  const [activeBlock, setActiveBlock] = useState<string | null>(null);
  const [showBlockMenu, setShowBlockMenu] = useState<string | null>(null);
  const [mode, setMode] = useState<'editor' | 'preview'>('editor');
  const [saving, setSaving] = useState(false);

  // Block operations
  const addBlock = useCallback((type: string, afterId: string) => {
    const afterIndex = article.blocks.findIndex(b => b.id === afterId);
    const newBlock: Block = {
      id: Date.now().toString(),
      type,
      content: '',
      metadata: {}
    };
    
    setArticle(prev => ({
      ...prev,
      blocks: [
        ...prev.blocks.slice(0, afterIndex + 1),
        newBlock,
        ...prev.blocks.slice(afterIndex + 1)
      ]
    }));
    
    setActiveBlock(newBlock.id);
  }, [article.blocks]);

  const updateBlock = useCallback((block: Block) => {
    setArticle(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => 
        b.id === block.id ? block : b
      )
    }));
  }, []);

  const deleteBlock = useCallback((id: string) => {
    if (article.blocks.length === 1) return; // Keep at least one block
    
    setArticle(prev => ({
      ...prev,
      blocks: prev.blocks.filter(block => block.id !== id)
    }));
  }, [article.blocks.length]);

  const duplicateBlock = useCallback((id: string) => {
    const blockIndex = article.blocks.findIndex(b => b.id === id);
    if (blockIndex === -1) return;

    const originalBlock = article.blocks[blockIndex];
    const newBlock: Block = {
      ...originalBlock,
      id: Date.now().toString()
    };
    
    setArticle(prev => ({
      ...prev,
      blocks: [
        ...prev.blocks.slice(0, blockIndex + 1),
        newBlock,
        ...prev.blocks.slice(blockIndex + 1)
      ]
    }));
  }, [article.blocks]);

  const moveBlock = useCallback((id: string, direction: 'up' | 'down') => {
    const index = article.blocks.findIndex(b => b.id === id);
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === article.blocks.length - 1)
    ) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newBlocks = [...article.blocks];
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    
    setArticle(prev => ({ ...prev, blocks: newBlocks }));
  }, [article.blocks]);

  // Handle save
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave?.(article);
    } finally {
      setSaving(false);
    }
  };



  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="px-6 py-3">
          {/* Breadcrumbs */}
          <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
            <span>Articles</span>
            <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
            <span>{article.category}</span>
            <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
            <span className="text-gray-900 dark:text-gray-100">
              {article.title || 'Untitled'}
            </span>
          </nav>

          {/* Action bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setMode('editor')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  mode === 'editor'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Editor
              </button>
              <button
                onClick={() => setMode('preview')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  mode === 'preview'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <Eye className="w-4 h-4 mr-1" />
                Preview
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200">
                <MessageSquare className="w-4 h-4" />
                <span>Comments</span>
              </button>
              <button className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200">
                <Clock className="w-4 h-4" />
                <span>History</span>
              </button>
              <button className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-1 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {mode === 'editor' ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 min-h-[800px]">
            {/* Page header */}
            <div className="p-8 border-b border-gray-100 dark:border-gray-700">
              {/* Add icon button */}
              <button className="flex items-center space-x-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-4 group">
                <div className="w-8 h-8 rounded border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center group-hover:border-gray-400">
                  <Smile className="w-4 h-4" />
                </div>
                <span className="text-sm">Add icon</span>
              </button>

              {/* Title */}
              <input
                type="text"
                value={article.title}
                onChange={(e) => setArticle(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Untitled page"
                className="w-full text-4xl font-bold bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 mb-4"
              />

              {/* Description */}
              <input
                type="text"
                value={article.description}
                onChange={(e) => setArticle(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Page description (optional)"
                className="w-full text-lg bg-transparent border-none outline-none text-gray-600 dark:text-gray-400 placeholder-gray-400"
              />
            </div>

            {/* Content blocks */}
            <div className="p-8">
              {article.blocks.map((block, index) => (
                <BlockEditor
                  key={block.id}
                  block={block}
                  isActive={activeBlock === block.id}
                  onFocus={() => setActiveBlock(block.id)}
                  onBlur={() => setActiveBlock(null)}
                  onUpdate={updateBlock}
                  onDelete={() => deleteBlock(block.id)}
                  onAddBlock={addBlock}
                  onDuplicate={() => duplicateBlock(block.id)}
                  onMoveUp={() => moveBlock(block.id, 'up')}
                  onMoveDown={() => moveBlock(block.id, 'down')}
                  canMoveUp={index > 0}
                  canMoveDown={index < article.blocks.length - 1}
                />
              ))}
            </div>
          </div>
        ) : (
          <ArticlePreview article={article} />
        )}
      </div>
    </div>
  );
}



// Article Preview Component
function ArticlePreview({ article }: { article: ArticleData }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
      <div className="prose prose-lg dark:prose-invert max-w-none">
        {article.title && (
          <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
        )}
        {article.description && (
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">{article.description}</p>
        )}
        
        {article.blocks.map((block) => {
          switch (block.type) {
            case 'heading1':
              return <h1 key={block.id} className="text-3xl font-bold mt-8 mb-4">{block.content}</h1>;
            case 'heading2':
              return <h2 key={block.id} className="text-2xl font-semibold mt-6 mb-4">{block.content}</h2>;
            case 'heading3':
              return <h3 key={block.id} className="text-xl font-medium mt-4 mb-2">{block.content}</h3>;
            case 'quote':
              return (
                <blockquote key={block.id} className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-700 dark:text-gray-300 my-4">
                  {block.content}
                </blockquote>
              );
            case 'code':
              return (
                <pre key={block.id} className="bg-gray-100 dark:bg-gray-800 rounded-md p-4 overflow-x-auto">
                  <code className="font-mono text-sm">{block.content}</code>
                </pre>
              );
            case 'list':
              return (
                <ul key={block.id} className="list-disc list-inside my-2">
                  <li>{block.content}</li>
                </ul>
              );
            default:
              return <p key={block.id} className="mb-4 leading-relaxed">{block.content}</p>;
          }
        })}
      </div>
    </div>
  );
}
