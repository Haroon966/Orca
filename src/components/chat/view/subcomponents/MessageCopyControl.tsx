import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { copyTextToClipboard } from '../../../../utils/clipboard';

const COPY_SUCCESS_TIMEOUT_MS = 2000;

type CopyFormat = 'text' | 'markdown';

type CopyFormatOption = {
  format: CopyFormat;
  label: string;
};

// Converts markdown into readable plain text for "Copy as text".
const convertMarkdownToPlainText = (markdown: string): string => {
  let plainText = markdown.replace(/\r\n/g, '\n');
  const codeBlocks: string[] = [];
  plainText = plainText.replace(/```[\w-]*\n([\s\S]*?)```/g, (_match, code: string) => {
    const placeholder = `@@CODEBLOCK${codeBlocks.length}@@`;
    codeBlocks.push(code.replace(/\n$/, ''));
    return placeholder;
  });
  plainText = plainText.replace(/`([^`]+)`/g, '$1');
  plainText = plainText.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '$1');
  plainText = plainText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');
  plainText = plainText.replace(/^>\s?/gm, '');
  plainText = plainText.replace(/^#{1,6}\s+/gm, '');
  plainText = plainText.replace(/^[-*+]\s+/gm, '');
  plainText = plainText.replace(/^\d+\.\s+/gm, '');
  plainText = plainText.replace(/(\*\*|__)(.*?)\1/g, '$2');
  plainText = plainText.replace(/(\*|_)(.*?)\1/g, '$2');
  plainText = plainText.replace(/~~(.*?)~~/g, '$1');
  plainText = plainText.replace(/<\/?[^>]+(>|$)/g, '');
  plainText = plainText.replace(/\n{3,}/g, '\n\n');
  plainText = plainText.replace(/@@CODEBLOCK(\d+)@@/g, (_match, index: string) => codeBlocks[Number(index)] ?? '');
  return plainText.trim();
};

const MessageCopyControl = ({
  content,
  messageType,
}: {
  content: string;
  messageType: 'user' | 'assistant';
}) => {
  const { t } = useTranslation('chat');
  const canSelectCopyFormat = messageType === 'assistant';
  const [copied, setCopied] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const copyFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copyFormatOptions: CopyFormatOption[] = useMemo(
    () => [
      {
        format: 'markdown',
        label: t('copyMessage.copyAsMarkdown', { defaultValue: 'Copy as markdown' }),
      },
      {
        format: 'text',
        label: t('copyMessage.copyAsText', { defaultValue: 'Copy as text' }),
      },
    ],
    [t],
  );

  useEffect(() => {
    setIsDropdownOpen(false);
  }, [content]);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!isDropdownOpen) return;
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsDropdownOpen(false);
      }
    };

    window.addEventListener('mousedown', closeOnOutsideClick);
    return () => {
      window.removeEventListener('mousedown', closeOnOutsideClick);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    return () => {
      if (copyFeedbackTimerRef.current) {
        clearTimeout(copyFeedbackTimerRef.current);
      }
    };
  }, []);

  const handleCopy = async (format: CopyFormat) => {
    const payload = format === 'markdown' ? content : convertMarkdownToPlainText(content);
    if (!payload.trim()) return;

    const didCopy = await copyTextToClipboard(payload);
    if (!didCopy) return;

    setCopied(true);
    setIsDropdownOpen(false);
    if (copyFeedbackTimerRef.current) {
      clearTimeout(copyFeedbackTimerRef.current);
    }
    copyFeedbackTimerRef.current = setTimeout(() => {
      setCopied(false);
    }, COPY_SUCCESS_TIMEOUT_MS);
  };

  const handleCopyButtonClick = () => {
    if (canSelectCopyFormat) {
      setIsDropdownOpen((previous) => !previous);
      return;
    }

    void handleCopy('text');
  };

  const toneClass = messageType === 'user'
    ? 'text-blue-100 hover:text-white'
    : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300';
  const copyTitle = copied
    ? t('copyMessage.copied')
    : canSelectCopyFormat
      ? t('copyMessage.selectFormat', { defaultValue: 'Select copy format' })
      : t('copyMessage.copy');

  return (
    <div ref={dropdownRef} className="relative flex items-center">
      <button
        type="button"
        onClick={handleCopyButtonClick}
        title={copyTitle}
        aria-label={copyTitle}
        aria-haspopup={canSelectCopyFormat ? 'menu' : undefined}
        aria-expanded={canSelectCopyFormat ? isDropdownOpen : undefined}
        className={`inline-flex items-center rounded p-1 transition-colors ${toneClass}`}
      >
        {copied ? (
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
        )}
      </button>

      {canSelectCopyFormat && isDropdownOpen && (
        <div
          className="absolute left-0 top-full z-30 mt-1 min-w-36 rounded-md border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-900"
          role="menu"
        >
          {copyFormatOptions.map((option) => (
            <button
              key={option.format}
              type="button"
              role="menuitem"
              onClick={() => {
                void handleCopy(option.format);
              }}
              className="block w-full rounded px-2 py-1.5 text-left text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/60"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageCopyControl;
