import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Spin, Result, message } from 'antd';
import { httpMutator } from '@/services/http';

interface PageData {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  html: string;
  css: string;
}

/** 序列化表单数据为键值对 */
function serializeForm(form: HTMLFormElement): Record<string, string> {
  const data: Record<string, string> = {};
  const fd = new FormData(form);
  fd.forEach((value, key) => {
    data[key] = typeof value === 'string' ? value : String(value);
  });
  return data;
}

/** 注入交互式组件的 JS 行为 */
function initInteractiveBehaviors(container: HTMLElement) {
  // ── 标签页切换 ──
  const tabs = container.querySelectorAll('[data-tabs]');
  tabs.forEach((tabGroup) => {
    const buttons = tabGroup.querySelectorAll<HTMLButtonElement>('[data-tab]');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        if (!tabId) return;

        // 切换按钮样式
        buttons.forEach((b) => {
          b.style.background = 'transparent';
          b.style.color = '#666';
          b.style.fontWeight = '400';
        });
        btn.style.background = '#fff';
        btn.style.color = '#333';
        btn.style.fontWeight = '500';

        // 切换内容面板
        const contents = tabGroup.querySelectorAll<HTMLElement>(
          `[data-tab-content]`,
        );
        contents.forEach((c) => {
          const isActive = c.getAttribute('data-tab-content') === tabId;
          c.style.display = isActive ? 'block' : 'none';
        });
      });
    });
  });

  // ── 轮播图 ──
  const carousels = container.querySelectorAll<HTMLElement>('[data-carousel]');
  carousels.forEach((carousel) => {
    const inner = carousel.querySelector<HTMLElement>('[data-carousel-inner]');
    const dots = carousel.querySelectorAll<HTMLElement>('[data-dot]');
    if (!inner || dots.length === 0) return;

    const items = inner.children;
    let current = 0;
    let timer: ReturnType<typeof setInterval> | null = null;

    const goTo = (index: number) => {
      if (index < 0) index = items.length - 1;
      if (index >= items.length) index = 0;
      current = index;
      inner.style.transform = `translateX(-${current * 100}%)`;
      dots.forEach((dot, i) => {
        (dot as HTMLElement).style.opacity = i === current ? '1' : '0.5';
      });
    };

    // 指示点点击
    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const idx = parseInt(dot.getAttribute('data-dot') || '0', 10);
        goTo(idx);
      });
    });

    // 自动轮播（每 4 秒）
    const startAutoPlay = () => {
      timer = setInterval(() => goTo(current + 1), 4000);
    };
    const stopAutoPlay = () => {
      if (timer) clearInterval(timer);
    };

    carousel.addEventListener('mouseenter', stopAutoPlay);
    carousel.addEventListener('mouseleave', startAutoPlay);
    startAutoPlay();
  });

  // ── 平滑滚动锚点 ──
  container.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector<HTMLElement>(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

const PageDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const fetchedSlug = useRef<string | undefined>(undefined);
  const fetchIdRef = useRef(0);
  const contentRef = useRef<HTMLDivElement>(null);

  /** 提交表单数据 */
  const handleFormSubmit = useCallback(
    async (e: Event) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      const currentSlug = fetchedSlug.current;
      if (!currentSlug) return;

      const submitBtn = form.querySelector<HTMLButtonElement>(
        'button[type="submit"]',
      );
      const originalText = submitBtn?.innerText || '提交';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = '提交中...';
      }

      try {
        const fields = serializeForm(form);
        await httpMutator<{ id: number; message: string }>({
          url: `/api/public/pages/${currentSlug}/submit`,
          method: 'POST',
          data: { fields },
        });
        // 替换表单为成功提示
        const successDiv = document.createElement('div');
        successDiv.style.cssText =
          'padding:32px;text-align:center;background:#f6ffed;border:1px solid #b7eb8f;border-radius:8px;';
        successDiv.innerHTML = `<div style="font-size:48px;margin-bottom:16px;">✅</div><h3 style="margin:0 0 8px;color:#52c41a;">提交成功</h3><p style="margin:0;color:#666;">感谢您的提交，我们会尽快处理。</p>`;
        form.parentNode?.replaceChild(successDiv, form);
      } catch (err) {
        const errorMessage =
          err && typeof err === 'object' && 'message' in err
            ? String((err as { message: string }).message)
            : '提交失败，请稍后重试';
        message.error(errorMessage);
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = originalText;
        }
      }
    },
    [],
  );

  /** 加载页面数据 */
  useEffect(() => {
    if (!slug) return;

    const currentFetchId = ++fetchIdRef.current;

    setLoading(true);
    setError(false);

    httpMutator<PageData>({
      url: `/api/public/pages/${slug}`,
      method: 'GET',
    })
      .then((pageData) => {
        // 防止并发请求乱序
        if (currentFetchId === fetchIdRef.current) {
          setData(pageData);
          setLoading(false);
          fetchedSlug.current = slug;
        }
      })
      .catch(() => {
        if (currentFetchId === fetchIdRef.current) {
          setError(true);
          setLoading(false);
        }
      });
  }, [slug]);

  /** 渲染后附加 JS 行为 */
  useEffect(() => {
    if (!data?.html || !contentRef.current) return;

    const container = contentRef.current;

    // 表单提交
    const forms = container.querySelectorAll<HTMLFormElement>(
      'form[data-page-form]',
    );
    forms.forEach((form) => {
      form.addEventListener('submit', handleFormSubmit);
    });

    // 交互式组件行为
    initInteractiveBehaviors(container);

    // 清理
    return () => {
      forms.forEach((form) => {
        form.removeEventListener('submit', handleFormSubmit);
      });
    };
  }, [data?.html, handleFormSubmit]);

  if (loading) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Result
        status="404"
        title="页面不存在"
        subTitle="该页面可能已被删除或尚未发布"
      />
    );
  }

  return (
    <>
      <Helmet>
        <title>
          {data.title
            ? `${data.title} - Abner's Blog`
            : 'Abner\'s Blog'}
        </title>
        {data.description && (
          <meta name="description" content={data.description} />
        )}
        {data.keywords && data.keywords.length > 0 && (
          <meta name="keywords" content={data.keywords.join(', ')} />
        )}
        {data.ogImage && <meta property="og:image" content={data.ogImage} />}
        {data.title && <meta property="og:title" content={data.title} />}
        {data.description && (
          <meta property="og:description" content={data.description} />
        )}
      </Helmet>
      {data.css && <style>{data.css}</style>}
      <div
        ref={contentRef}
        dangerouslySetInnerHTML={{ __html: data.html }}
        style={{ minHeight: '100vh' }}
      />
    </>
  );
};

export default PageDetail;
