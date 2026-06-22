import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Spin, Result, Button } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { httpMutator } from "@/services/http";

interface PageData {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  html: string;
  css: string;
}

const PagePreview: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const fetchIdRef = useRef(0);

  useEffect(() => {
    if (!slug) return;

    const currentFetchId = ++fetchIdRef.current;

    setLoading(true);
    setError(false);

    httpMutator<PageData>({
      url: `/api/public/pages/${slug}`,
      method: "GET",
    })
      .then((pageData) => {
        if (currentFetchId === fetchIdRef.current) {
          setData(pageData);
          setLoading(false);
        }
      })
      .catch(() => {
        if (currentFetchId === fetchIdRef.current) {
          setError(true);
          setLoading(false);
        }
      });
  }, [slug]);

  // 预览页需要 body 原生滚动，覆盖全局 html/body/#root overflow: hidden
  useEffect(() => {
    const htmlEl = document.documentElement;
    const bodyEl = document.body;
    const rootEl = document.getElementById("root");
    const origHtml = htmlEl.style.overflow;
    const origBody = bodyEl.style.overflow;
    const origRoot = rootEl?.style.overflow;
    htmlEl.style.overflow = "auto";
    bodyEl.style.overflow = "auto";
    if (rootEl) rootEl.style.overflow = "auto";
    return () => {
      htmlEl.style.overflow = origHtml;
      bodyEl.style.overflow = origBody;
      if (rootEl) rootEl.style.overflow = origRoot || "";
    };
  }, []);

  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <Spin size="large" />
        <span style={{ color: "#999" }}>正在加载页面…</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Result
        status="404"
        title="页面不存在"
        subTitle="该页面可能已被删除或尚未发布"
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/")}>
            返回页面列表
          </Button>
        }
      />
    );
  }

  return (
    <>
      {data.css && <style>{data.css}</style>}
      <div
        dangerouslySetInnerHTML={{ __html: data.html }}
        style={{ minHeight: "100vh" }}
      />
    </>
  );
};

export default PagePreview;
