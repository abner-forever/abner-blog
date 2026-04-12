import {
  Fragment,
  cloneElement,
  isValidElement,
  memo,
  useCallback,
  useState,
  type ReactNode,
} from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  oneDark,
  oneLight,
} from 'react-syntax-highlighter/dist/esm/styles/prism';

const CodeBlock = memo<{
  codeString: string;
  language: string;
  isDark?: boolean;
  isCollapsed: boolean;
  onToggle: () => void;
}>(({ codeString, language, isDark, isCollapsed, onToggle }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [codeString]);

  return (
    <div className={`code-block ${isDark ? 'dark' : ''}`}>
      <div className="code-header">
        <span className="code-traffic-lights" aria-hidden>
          <i />
          <i />
          <i />
        </span>
        <div className="code-actions">
          <span className="code-lang">{language}</span>
          {codeString.split('\n').length > 6 && (
            <button onClick={onToggle}>{isCollapsed ? '展开' : '收起'}</button>
          )}
          <button onClick={handleCopy}>{copied ? '已复制' : '复制'}</button>
        </div>
      </div>
      <SyntaxHighlighter
        style={isDark ? oneDark : oneLight}
        language={language}
        PreTag="div"
        customStyle={{
          margin: 0,
          padding: '14px',
          borderRadius: '0 0 8px 8px',
          fontSize: '14px',
          lineHeight: 1.6,
          maxHeight: isCollapsed ? '60px' : 'none',
          overflow: isCollapsed ? 'hidden' : 'auto',
        }}
      >
        {codeString}
      </SyntaxHighlighter>
      {codeString.split('\n').length > 6 && isCollapsed && (
        <div className="code-fade" />
      )}
    </div>
  );
});

CodeBlock.displayName = 'CodeBlock';

/** 模型常在 GFM 表格单元格里写字面量 `<br>`；默认 Markdown 不会当 HTML 解析，此处转为真实换行。 */
function renderLiteralBrInChildren(node: ReactNode): ReactNode {
  if (node == null || typeof node === 'boolean') return node;
  if (typeof node === 'number') return node;
  if (typeof node === 'string') {
    if (!/<br\s*\/?>/i.test(node)) return node;
    const parts = node.split(/<br\s*\/?>/gi);
    return parts.map((part, i) => (
      <Fragment key={i}>
        {i > 0 ? <br /> : null}
        {part}
      </Fragment>
    ));
  }
  if (Array.isArray(node)) {
    return node.map((child, i) => (
      <Fragment key={i}>{renderLiteralBrInChildren(child)}</Fragment>
    ));
  }
  if (isValidElement(node)) {
    const elType = node.type;
    if (elType === 'code' || elType === 'pre' || elType === CodeBlock) {
      return node;
    }
    const props = node.props as { children?: ReactNode };
    if (props.children === undefined) return node;
    return cloneElement(node, {
      ...node.props,
      children: renderLiteralBrInChildren(props.children),
    } as Record<string, unknown>);
  }
  return node;
}

const MarkdownRenderer = memo<{ content: string; isDark?: boolean }>(
  ({ content, isDark }) => {
    const [collapsedCodes, setCollapsedCodes] = useState<Set<string>>(new Set());

    const toggleCode = useCallback((key: string) => {
      setCollapsedCodes((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        return next;
      });
    }, []);

    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table({ children, ...props }) {
            return (
              <div className="markdown-gfm-table">
                <table {...props}>{children}</table>
              </div>
            );
          },
          td({ children, ...props }) {
            return (
              <td {...props}>{renderLiteralBrInChildren(children)}</td>
            );
          },
          th({ children, ...props }) {
            return (
              <th {...props}>{renderLiteralBrInChildren(children)}</th>
            );
          },
          p({ children, ...props }) {
            return <p {...props}>{renderLiteralBrInChildren(children)}</p>;
          },
          li({ children, ...props }) {
            return <li {...props}>{renderLiteralBrInChildren(children)}</li>;
          },
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const codeKey = `${node?.position?.start?.line || 0}-${String(children).slice(0, 20)}`;
            const isInline = !match && !String(children).includes('\n');

            if (isInline) {
              return (
                <code className="inline-code" {...props}>
                  {children}
                </code>
              );
            }

            const codeString = String(children).replace(/\n$/, '');
            const isCollapsed = collapsedCodes.has(codeKey);

            return (
              <CodeBlock
                codeString={codeString}
                language={match?.[1] || 'text'}
                isDark={isDark}
                isCollapsed={isCollapsed}
                onToggle={() => toggleCode(codeKey)}
              />
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    );
  },
);

MarkdownRenderer.displayName = 'MarkdownRenderer';

export default MarkdownRenderer;
