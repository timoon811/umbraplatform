"use client";

import { useState, useRef, useEffect } from 'react';
import { 
  Plus, X, GripVertical, ChevronDown, 
  Bold, Italic, Underline, Link2, Code,
  AlignLeft, AlignCenter, AlignRight,
  MoreHorizontal, Copy, Trash2, MoveUp, MoveDown
} from 'lucide-react';
import BlockTypeMenu from './BlockTypeMenu';

export interface Block {
  id: string;
  type: string;
  content: string;
  metadata?: {
    alignment?: 'left' | 'center' | 'right';
    color?: string;
    backgroundColor?: string;
    url?: string;
    alt?: string;
    caption?: string;
    language?: string;
    rows?: number;
    columns?: number;
  };
}

interface BlockEditorProps {
  block: Block;
  isActive: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onUpdate: (block: Block) => void;
  onDelete: () => void;
  onAddBlock: (type: string, afterId: string) => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export default function BlockEditor({
  block,
  isActive,
  onFocus,
  onBlur,
  onUpdate,
  onDelete,
  onAddBlock,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown
}: BlockEditorProps) {
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const contentRef = useRef<HTMLElement>(null);

  const updateContent = (content: string) => {
    onUpdate({ ...block, content });
  };

  const updateMetadata = (metadata: Partial<Block['metadata']>) => {
    onUpdate({ 
      ...block, 
      metadata: { ...block.metadata, ...metadata } 
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onAddBlock('paragraph', block.id);
    } else if (e.key === 'Backspace' && block.content === '') {
      e.preventDefault();
      onDelete();
    } else if (e.key === '/' && block.content === '') {
      e.preventDefault();
      setShowTypeMenu(true);
    }
  };

  const renderBlockContent = () => {
    const commonProps = {
      ref: contentRef,
      value: block.content,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
        updateContent(e.target.value),
      onFocus,
      onBlur,
      onKeyDown: handleKeyDown,
      placeholder: getPlaceholder(),
      className: `w-full bg-transparent border-none outline-none resize-none ${getBlockStyles()}`
    };

    switch (block.type) {
      case 'heading1':
        return (
          <input 
            {...commonProps}
            className={`${commonProps.className} text-3xl font-bold text-gray-900 dark:text-gray-100`}
          />
        );
      
      case 'heading2':
        return (
          <input 
            {...commonProps}
            className={`${commonProps.className} text-2xl font-semibold text-gray-900 dark:text-gray-100`}
          />
        );
      
      case 'heading3':
        return (
          <input 
            {...commonProps}
            className={`${commonProps.className} text-xl font-medium text-gray-900 dark:text-gray-100`}
          />
        );

      case 'quote':
        return (
          <div className="border-l-4 border-blue-500 pl-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-r-md">
            <textarea 
              {...commonProps}
              className={`${commonProps.className} text-gray-700 dark:text-gray-300 italic min-h-[80px]`}
              rows={3}
            />
          </div>
        );

      case 'code':
        return (
          <div className="bg-gray-100 dark:bg-gray-800 rounded-md border">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700">
              <select
                value={block.metadata?.language || 'text'}
                onChange={(e) => updateMetadata({ language: e.target.value })}
                className="text-xs bg-transparent border-none outline-none text-gray-600 dark:text-gray-400"
              >
                <option value="text">Plain Text</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="json">JSON</option>
                <option value="bash">Bash</option>
              </select>
            </div>
            <textarea 
              {...commonProps}
              className={`${commonProps.className} font-mono text-sm text-gray-900 dark:text-gray-100 p-4 min-h-[120px]`}
              rows={6}
            />
          </div>
        );

      case 'list':
        return (
          <div className="flex items-start">
            <span className="text-gray-400 mr-3 mt-1">•</span>
            <textarea 
              {...commonProps}
              className={`${commonProps.className} text-gray-900 dark:text-gray-100 flex-1 min-h-[24px]`}
              rows={1}
            />
          </div>
        );

      case 'numbered-list':
        return (
          <div className="flex items-start">
            <span className="text-gray-400 mr-3 mt-1">1.</span>
            <textarea 
              {...commonProps}
              className={`${commonProps.className} text-gray-900 dark:text-gray-100 flex-1 min-h-[24px]`}
              rows={1}
            />
          </div>
        );

      case 'callout':
        return (
          <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
            <div className="flex items-center mb-2">
              <span className="text-xl mr-2">💡</span>
              <input
                type="text"
                value={block.metadata?.caption || 'Callout'}
                onChange={(e) => updateMetadata({ caption: e.target.value })}
                className="font-medium bg-transparent border-none outline-none text-yellow-800 dark:text-yellow-200"
                placeholder="Callout title"
              />
            </div>
            <textarea 
              {...commonProps}
              className={`${commonProps.className} text-yellow-800 dark:text-yellow-200 min-h-[60px]`}
              rows={2}
            />
          </div>
        );

      case 'image':
        return (
          <div className="border border-gray-200 dark:border-gray-700 rounded-md p-4">
            {block.metadata?.url ? (
              <div>
                <img 
                  src={block.metadata.url} 
                  alt={block.metadata.alt || ''}
                  className="max-w-full h-auto rounded"
                />
                <input
                  type="text"
                  value={block.metadata.caption || ''}
                  onChange={(e) => updateMetadata({ caption: e.target.value })}
                  placeholder="Image caption (optional)"
                  className="w-full mt-2 text-sm text-gray-600 dark:text-gray-400 bg-transparent border-none outline-none"
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">📷</div>
                <input
                  type="url"
                  value={block.content}
                  onChange={(e) => {
                    updateContent(e.target.value);
                    updateMetadata({ url: e.target.value });
                  }}
                  placeholder="Paste image URL..."
                  className="w-full text-center bg-transparent border-none outline-none text-gray-600 dark:text-gray-400"
                />
              </div>
            )}
          </div>
        );

      case 'divider':
        return (
          <div className="py-4">
            <hr className="border-gray-300 dark:border-gray-600" />
          </div>
        );

      default: // paragraph
        return (
          <textarea 
            {...commonProps}
            className={`${commonProps.className} text-gray-900 dark:text-gray-100 min-h-[24px] leading-relaxed`}
            rows={1}
          />
        );
    }
  };

  const getPlaceholder = () => {
    switch (block.type) {
      case 'heading1': return 'Heading 1';
      case 'heading2': return 'Heading 2';
      case 'heading3': return 'Heading 3';
      case 'quote': return 'Quote';
      case 'code': return 'Code';
      case 'list': return 'List item';
      case 'numbered-list': return 'List item';
      case 'callout': return 'Callout content';
      case 'image': return 'Image URL';
      default: return 'Type / for commands';
    }
  };

  const getBlockStyles = () => {
    const alignment = block.metadata?.alignment || 'left';
    const alignmentClass = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right'
    }[alignment];

    return `placeholder-gray-400 ${alignmentClass}`;
  };

  return (
    <div 
      className="group relative mb-2 hover:bg-gray-50 dark:hover:bg-gray-800/30 rounded-lg transition-colors"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Block controls */}
      {(showControls || isActive) && (
        <div className="absolute left-0 top-2 transform -translate-x-12 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="w-6 h-6 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            title="Drag to reorder"
          >
            <GripVertical className="w-3 h-3" />
          </button>
          <button
            onClick={() => setShowTypeMenu(!showTypeMenu)}
            className="w-6 h-6 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400"
            title="Change block type"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Actions menu */}
      {(showControls || isActive) && (
        <div className="absolute right-0 top-2 transform translate-x-12 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="w-6 h-6 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              title="More actions"
            >
              <MoreHorizontal className="w-3 h-3" />
            </button>

            {showActions && (
              <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                <button
                  onClick={() => {
                    onDuplicate();
                    setShowActions(false);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                >
                  <Copy className="w-4 h-4" />
                  <span>Duplicate</span>
                </button>
                {canMoveUp && (
                  <button
                    onClick={() => {
                      onMoveUp();
                      setShowActions(false);
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                  >
                    <MoveUp className="w-4 h-4" />
                    <span>Move up</span>
                  </button>
                )}
                {canMoveDown && (
                  <button
                    onClick={() => {
                      onMoveDown();
                      setShowActions(false);
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                  >
                    <MoveDown className="w-4 h-4" />
                    <span>Move down</span>
                  </button>
                )}
                <hr className="my-1 border-gray-200 dark:border-gray-600" />
                <button
                  onClick={() => {
                    onDelete();
                    setShowActions(false);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Block content */}
      <div className="px-2 py-1">
        {renderBlockContent()}
      </div>

      {/* Block type menu */}
      {showTypeMenu && (
        <BlockTypeMenu
          onSelect={(type) => {
            onAddBlock(type, block.id);
            setShowTypeMenu(false);
          }}
          onClose={() => setShowTypeMenu(false)}
          position={{ x: 0, y: 40 }}
        />
      )}
    </div>
  );
}
