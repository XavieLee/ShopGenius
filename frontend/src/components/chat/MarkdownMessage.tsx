import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import cls from 'classnames';

interface MarkdownMessageProps {
  content: string;
  isStreaming?: boolean;
  className?: string;
}

/**
 * 支持Markdown渲染的消息组件
 */
export function MarkdownMessage({
  content,
  isStreaming = false,
  className
}: MarkdownMessageProps) {
  return (
    <div className={cls('markdown-content', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // 自定义渲染组件
          p: ({ children }) => (
            <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
          ),
          h1: ({ children }) => (
            <h1 className="text-xl font-bold mb-4 mt-6 first:mt-0 text-white">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold mb-3 mt-5 first:mt-0 text-white">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-medium mb-2 mt-4 first:mt-0 text-white">
              {children}
            </h3>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-3 space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-3 space-y-1">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-400 pl-4 py-2 mb-3 bg-blue-900/30 italic text-blue-100">
              {children}
            </blockquote>
          ),
          code: ({ children, ...props }: any) => {
            const inline = !props.className?.includes('language-');
            if (inline) {
              return (
                <code 
                  className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono text-red-700 dark:text-red-300"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code 
                className="block bg-gray-900 dark:bg-gray-900 p-3 rounded-lg text-sm font-mono overflow-x-auto mb-3 text-gray-100"
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-gray-900 dark:bg-gray-900 p-3 rounded-lg overflow-x-auto mb-3 text-gray-100">
              {children}
            </pre>
          ),
          a: ({ href, children }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-300 hover:text-blue-200 hover:underline"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-white">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-3">
              <table className="min-w-full border-collapse border border-gray-600">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-gray-600 px-3 py-2 bg-gray-800 font-semibold text-left text-white">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-600 px-3 py-2 text-white">
              {children}
            </td>
          ),
          hr: () => (
            <hr className="my-4 border-gray-600" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
      
      {/* 流式显示时的光标 */}
      {isStreaming && (
        <span className="inline-block w-0.5 h-4 bg-current ml-1 animate-pulse">
          |
        </span>
      )}
    </div>
  );
}

/**
 * 增强的聊天消息组件，支持Markdown渲染
 */
interface EnhancedMarkdownMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  timestamp?: string;
  onComplete?: () => void;
}

export function EnhancedMarkdownMessage({
  role,
  content,
  isStreaming = false,
  timestamp,
  onComplete
}: EnhancedMarkdownMessageProps) {
  const formatMessageTime = (timestamp?: string) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={cls("flex", role === "user" ? "justify-end" : "justify-start")}>
      {/* AI头像 */}
      {role === "assistant" && (
        <div className="w-8 h-8 rounded-full overflow-hidden mr-3 flex-shrink-0 self-start">
          <img 
            src="/girl.gif" 
            alt="AI助手" 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      {/* 消息气泡 */}
      <div className="max-w-[75%] space-y-3">
        <div className={cls(
          "rounded-2xl px-4 py-3 shadow-sm relative group",
          role === "user" 
            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white" 
            : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        )}>
          <div>
            {role === "assistant" ? (
              <MarkdownMessage
                content={content}
                isStreaming={isStreaming}
                className="prose prose-sm max-w-none dark:prose-invert"
              />
            ) : (
              <div className="leading-relaxed text-sm whitespace-pre-wrap">{content}</div>
            )}
          </div>
        </div>
        
        {/* 时间戳 */}
        {timestamp && (
          <div className={cls("text-xs mt-1 text-right",
            role === "user" 
              ? "text-blue-300" 
              : "text-gray-500 dark:text-gray-400"
          )}>
            {formatMessageTime(timestamp)}
          </div>
        )}
      </div>
    </div>
  );
}
