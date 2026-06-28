import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Input,
  Select,
  Card,
  Spin,
  Tag,
  message,
  Typography,
  Space,
  Alert,
  Skeleton,
  Result,
  Modal,
} from "antd";
import {
  SendOutlined,
  RocketOutlined,
  ReloadOutlined,
  EditOutlined,
  CheckOutlined,
  LoadingOutlined,
  RobotOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { STYLE_THEMES, REGION_DEFINITIONS } from "@/utils/component-metadata";
import { schemaToHtml } from "@/utils/schemaToHtml";

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;

/* ==================== Types ==================== */

interface LLMConfig {
  provider: string;
  apiKey: string;
  baseUrl?: string;
  model?: string;
  hasApiKey?: boolean;
}

interface RegionState {
  regionId: string;
  regionType: string;
  name: string;
  status: "pending" | "generating" | "completed" | "error";
  schema?: Record<string, unknown>;
}

interface PagePreviewData {
  pageSchema: Record<string, unknown>;
  regions: Array<{ regionId: string; regionType: string; name: string; status: string }>;
  sessionId: string;
}

type StepKey = "config" | "prompt" | "preview";

/* ==================== Helper ==================== */

const providerLabel = (provider: string): string => {
  const map: Record<string, string> = {
    deepseek: "DeepSeek",
    openai: "GPT-4o",
    anthropic: "Claude",
  };
  return map[provider] || provider;
};

/* ==================== Page Component ==================== */

const AiPageGenerator: React.FC = () => {
  const navigate = useNavigate();

  // Wizard state
  const [currentStep, setCurrentStep] = useState<StepKey>("config");
  const [loading, setLoading] = useState(false);

  // Step 1: Config
  const [config, setConfig] = useState<LLMConfig>({
    provider: "deepseek",
    apiKey: "",
    baseUrl: "",
    model: "",
  });
  const [configSaved, setConfigSaved] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);
  const [configModalOpen, setConfigModalOpen] = useState(false);

  // Step 2: Prompt
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("modern");
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);

  // Step 3: Preview
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [regions, setRegions] = useState<RegionState[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [pageData, setPageData] = useState<PagePreviewData | null>(null);
  const [regionComponents, setRegionComponents] = useState<
    Record<string, Array<{ type: string; props: Record<string, unknown> }>>
  >({});
  const eventSourceRef = useRef<EventSource | null>(null);

  // Iteration chat
  const [chatMessages, setChatMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load existing config on mount
  useEffect(() => {
    loadConfig();
  }, []);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  /* ==================== Config API ==================== */

  const loadConfig = async () => {
    setConfigLoading(true);
    try {
      const { httpMutator } = await import("@/services/http");
      const result = (await httpMutator({
        url: "/api/page-generator/config",
        method: "GET",
      })) as LLMConfig & { hasApiKey: boolean; createdAt: string };
      if (result) {
        setConfig({
          provider: result.provider || "deepseek",
          apiKey: "",
          baseUrl: result.baseUrl || "",
          model: result.model || "",
          hasApiKey: result.hasApiKey,
        });
        if (result.hasApiKey) {
          setConfigSaved(true);
          // Auto-skip to prompt step if config already exists
          setCurrentStep("prompt");
        }
      }
    } catch {
      // Config not set up yet
    } finally {
      setConfigLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!config.apiKey && !config.hasApiKey) {
      message.error("请输入 API Key");
      return;
    }
    try {
      const { httpMutator } = await import("@/services/http");
      await httpMutator({
        url: "/api/page-generator/config",
        method: "POST",
        data: {
          provider: config.provider,
          apiKey: config.apiKey || undefined,
          baseUrl: config.baseUrl || undefined,
          model: config.model || undefined,
        },
      });
      message.success("API 配置保存成功");
      setConfigSaved(true);
      setCurrentStep("prompt");
    } catch (err) {
      message.error("配置保存失败，请重试");
    }
  };

  const handleSaveConfigFromModal = async () => {
    if (!config.apiKey && !config.hasApiKey) {
      message.error("请输入 API Key");
      return;
    }
    try {
      const { httpMutator } = await import("@/services/http");
      await httpMutator({
        url: "/api/page-generator/config",
        method: "POST",
        data: {
          provider: config.provider,
          apiKey: config.apiKey || undefined,
          baseUrl: config.baseUrl || undefined,
          model: config.model || undefined,
        },
      });
      message.success("API 配置已更新");
      setConfigSaved(true);
      setConfigModalOpen(false);
    } catch (err) {
      message.error("配置更新失败，请重试");
    }
  };

  /* ==================== Generation API ==================== */

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      message.error("请输入页面描述");
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setRegions([]);
    setRegionComponents({});
    setPageData(null);
    setChatMessages([]);

    try {
      const response = await fetch("/api/page-generator/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("editor-token")}`,
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          style: selectedStyle,
          regions: selectedRegions.length > 0 ? selectedRegions : undefined,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "生成失败");
      }

      // Handle SSE stream
      const reader = response.body?.getReader();
      if (!reader) throw new Error("无法建立 SSE 连接");

      const decoder = new TextDecoder();
      let buffer = "";
      let connected = false;

      const processEvent = (event: string, data: Record<string, unknown>) => {
        switch (event) {
          case "connected":
            connected = true;
            break;

          case "session_id":
            setSessionId(data.sessionId as string);
            break;

          case "region_start":
            setRegions((prev) => [
              ...prev,
              {
                regionId: data.regionId as string,
                regionType: data.regionType as string,
                name: data.name as string,
                status: "generating",
              },
            ]);
            setRegionComponents((prev) => ({
              ...prev,
              [data.regionId as string]: [],
            }));
            break;

          case "region_component":
            setRegionComponents((prev) => {
              const regionId = data.regionId as string;
              const existing = prev[regionId] || [];
              return {
                ...prev,
                [regionId]: [
                  ...existing,
                  {
                    type: data.componentType as string,
                    props: data.props as Record<string, unknown>,
                  },
                ],
              };
            });
            break;

          case "region_end":
            setRegions((prev) =>
              prev.map((r) =>
                r.regionId === data.regionId
                  ? {
                      ...r,
                      status: "completed",
                      schema: data.schema as Record<string, unknown>,
                    }
                  : r,
              ),
            );
            break;

          case "complete":
            setPageData(data as unknown as PagePreviewData);
            setIsGenerating(false);
            message.success("页面生成完成！");
            break;

          case "error":
            setGenerationError(data.message as string);
            // Mark generating regions as error
            setRegions((prev) =>
              prev.map((r) =>
                r.status === "generating"
                  ? { ...r, status: "error" as const }
                  : r,
              ),
            );
            if (!data.retryable) {
              setIsGenerating(false);
            }
            break;
        }
      };

      // Read the stream
      let streamDone = false;
      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) {
          streamDone = true;
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let currentEvent = "";
        let currentData = "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            currentData = line.slice(6).trim();
          } else if (line === "" && currentEvent && currentData) {
            try {
              const parsed = JSON.parse(currentData);
              processEvent(currentEvent, parsed);
            } catch {
              // Skip malformed JSON
            }
            currentEvent = "";
            currentData = "";
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "生成失败";
      setGenerationError(msg);
      message.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  /* ==================== Refinement Chat ==================== */

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !sessionId) return;

    const userMessage = chatInput.trim();
    setChatMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage },
    ]);
    setChatInput("");
    setChatLoading(true);

    try {
      const response = await fetch("/api/page-generator/refine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("editor-token")}`,
        },
        body: JSON.stringify({
          sessionId,
          message: userMessage,
        }),
      });

      if (!response.ok) {
        throw new Error("修改请求失败");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("无法连接");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let currentEvent = "";
        let currentData = "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            currentData = line.slice(6).trim();
          } else if (line === "" && currentEvent && currentData) {
            try {
              const parsed = JSON.parse(currentData);
              if (currentEvent === "complete") {
                setPageData(parsed as unknown as PagePreviewData);
                setChatMessages((prev) => [
                  ...prev,
                  {
                    role: "assistant",
                    content: "页面已更新！你可以继续描述更多修改需求。",
                  },
                ]);
                message.success("页面已更新");
              } else if (currentEvent === "error") {
                setChatMessages((prev) => [
                  ...prev,
                  {
                    role: "assistant",
                    content: `修改失败：${parsed.message}。请重新描述你的需求。`,
                  },
                ]);
              }
            } catch {
              // Skip malformed JSON
            }
            currentEvent = "";
            currentData = "";
          }
        }
      }
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "修改请求失败，请重试。",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  /* ==================== Load into Editor ==================== */

  const handleLoadIntoEditor = async () => {
    if (!sessionId) return;

    // Ask for page title
    Modal.confirm({
      title: "载入编辑器",
      content: (
        <div>
          <p style={{ marginBottom: 12 }}>请输入页面标题：</p>
          <Input
            id="ai-page-title-input"
            defaultValue={prompt.slice(0, 50)}
            placeholder="页面标题"
          />
        </div>
      ),
      okText: "载入编辑器",
      cancelText: "取消",
      onOk: async () => {
        const titleInput = document.getElementById(
          "ai-page-title-input",
        ) as HTMLInputElement;
        const title = titleInput?.value || prompt.slice(0, 50);

        try {
          const { httpMutator } = await import("@/services/http");
          const result = (await httpMutator({
            url: "/api/page-generator/load",
            method: "POST",
            data: {
              sessionId,
              title,
            },
          })) as { pageId: number; slug: string };

          message.success("页面已创建，正在打开编辑器...");
          navigate(`/editor/${result.slug}`);
        } catch (err) {
          message.error("载入编辑器失败，请重试");
        }
      },
    });
  };

  /* ==================== Steps Render ==================== */

  const handleStepClick = (step: StepKey) => {
    if (step === "config") setCurrentStep("config");
    else if (step === "prompt" && configSaved) setCurrentStep("prompt");
    else if (step === "preview" && pageData) setCurrentStep("preview");
  };

  const stepStatus = (step: StepKey): "process" | "finish" | "wait" => {
    if (currentStep === step) return "process";
    if (step === "config") return configSaved ? "finish" : "wait";
    if (step === "prompt") return pageData ? "finish" : configSaved ? "wait" : "wait";
    return "wait";
  };

  return (
    <div className="ai-page-generator">
      <div className="ai-page-generator__header">
        <Button type="text" onClick={() => navigate("/")}>
          ← 返回
        </Button>
        <Title level={3} style={{ margin: 0 }}>
          <RobotOutlined style={{ marginRight: 8 }} />
          AI 页面生成
        </Title>
        <Text type="secondary">用自然语言描述页面效果，AI 自动生成完整页面</Text>
        <div style={{ flex: 1 }} />
        {configSaved && (
          <Button
            icon={<SettingOutlined />}
            onClick={() => setConfigModalOpen(true)}
            size="small"
          >
            {providerLabel(config.provider)}
          </Button>
        )}
      </div>

      {/* Steps indicator */}
      <div className="ai-page-generator__steps">
        <div
          className={`ai-page-generator__step-item ${stepStatus("config") === "finish" ? "completed" : ""} ${currentStep === "config" ? "active" : ""}`}
          onClick={() => handleStepClick("config")}
        >
          <div className="ai-page-generator__step-number">
            {stepStatus("config") === "finish" ? <CheckOutlined /> : "1"}
          </div>
          <div>
            <div className="ai-page-generator__step-title">配置 API</div>
            <div className="ai-page-generator__step-desc">选择 AI 模型并配置密钥</div>
          </div>
        </div>
        <div className="ai-page-generator__step-connector" />
        <div
          className={`ai-page-generator__step-item ${stepStatus("prompt") === "finish" ? "completed" : ""} ${currentStep === "prompt" ? "active" : ""} ${!configSaved ? "disabled" : ""}`}
          onClick={() => handleStepClick("prompt")}
        >
          <div className="ai-page-generator__step-number">
            {stepStatus("prompt") === "finish" ? <CheckOutlined /> : "2"}
          </div>
          <div>
            <div className="ai-page-generator__step-title">描述需求</div>
            <div className="ai-page-generator__step-desc">选择风格并描述页面</div>
          </div>
        </div>
        <div className="ai-page-generator__step-connector" />
        <div
          className={`ai-page-generator__step-item ${currentStep === "preview" ? "active" : ""} ${!pageData ? "disabled" : ""}`}
          onClick={() => handleStepClick("preview")}
        >
          <div className="ai-page-generator__step-number">3</div>
          <div>
            <div className="ai-page-generator__step-title">生成预览</div>
            <div className="ai-page-generator__step-desc">预览并载入编辑器</div>
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: "#f0f0f0", margin: "8px 0" }} />

      {/* ==================== Step 1: Config ==================== */}
      {currentStep === "config" && (
        <div className="ai-page-generator__content">
          <Card title="配置 AI 模型" className="ai-page-generator__card">
            {configLoading ? (
              <Skeleton active paragraph={{ rows: 3 }} />
            ) : (
              <Space direction="vertical" size="large" style={{ width: "100%" }}>
                <div>
                  <Text strong>选择 LLM 提供商</Text>
                  <Select
                    value={config.provider}
                    onChange={(val) =>
                      setConfig((prev) => ({ ...prev, provider: val }))
                    }
                    style={{ width: "100%", marginTop: 8 }}
                    options={[
                      {
                        value: "deepseek",
                        label: "DeepSeek（性价比高）",
                      },
                      {
                        value: "openai",
                        label: "OpenAI（GPT-4o）",
                      },
                      {
                        value: "anthropic",
                        label: "Anthropic Claude（Sonnet）",
                      },
                    ]}
                  />
                </div>

                <div>
                  <Text strong>API Key</Text>
                  <Input.Password
                    value={config.apiKey}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        apiKey: e.target.value,
                      }))
                    }
                    placeholder={config.hasApiKey ? "已保存密钥，留空使用已有密钥" : "输入 API Key"}
                    style={{ marginTop: 8 }}
                  />
                </div>

                <div>
                  <Text strong>自定义 API 地址（可选）</Text>
                  <Input
                    value={config.baseUrl}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        baseUrl: e.target.value,
                      }))
                    }
                    placeholder="留空使用默认地址"
                    style={{ marginTop: 8 }}
                  />
                </div>

                <div>
                  <Text strong>模型名称（可选）</Text>
                  <Input
                    value={config.model}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        model: e.target.value,
                      }))
                    }
                    placeholder="留空使用默认模型"
                    style={{ marginTop: 8 }}
                  />
                </div>

                <Alert
                  type="info"
                  showIcon
                  message="API Key 仅存储在您的账户中，不会分享给他人。"
                />

                <Button
                  type="primary"
                  size="large"
                  icon={<ArrowRightOutlined />}
                  onClick={handleSaveConfig}
                  block
                >
                  保存并继续
                </Button>
              </Space>
            )}
          </Card>
        </div>
      )}

      {/* ==================== Step 2: Prompt ==================== */}
      {currentStep === "prompt" && (
        <div className="ai-page-generator__content">
          <div className="ai-page-generator__prompt-layout">
            <Card title="选择风格" className="ai-page-generator__card" style={{ flex: 1 }}>
              <div className="ai-page-generator__style-grid">
                {STYLE_THEMES.map((theme) => (
                  <Card
                    key={theme.id}
                    size="small"
                    hoverable
                    className={`ai-page-generator__style-card ${selectedStyle === theme.id ? "selected" : ""}`}
                    onClick={() => setSelectedStyle(theme.id)}
                  >
                    <div
                      className="ai-page-generator__style-color"
                      style={{ backgroundColor: theme.colorPrimary }}
                    />
                    <div className="ai-page-generator__style-name">
                      {theme.name}
                    </div>
                    <div className="ai-page-generator__style-desc">
                      {theme.description}
                    </div>
                  </Card>
                ))}
              </div>
            </Card>

            <Card
              title="描述页面需求"
              className="ai-page-generator__card"
              style={{ flex: 2 }}
            >
              <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                <div>
                  <Text strong>请描述你想要的页面</Text>
                  <TextArea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={
                      '例如：\n为一家在线教育公司创建一个着陆页，包含：\n- 顶部导航栏（Logo + 菜单：课程、价格、关于我们）\n- 主视觉区域（大标题"学无止境，行以致远" + 副标题 + 注册按钮）\n- 三个特色卡片（名师授课、灵活学习、证书认证）\n- 课程价格表（三个档次：基础/专业/企业）\n- 底部版权信息'
                    }
                    rows={8}
                    showCount
                    maxLength={2000}
                  />
                </div>

                <div>
                  <Text strong>选择页面区域（可选，不选则由 AI 自动规划）</Text>
                  <div style={{ marginTop: 8 }}>
                    <Space wrap>
                      {REGION_DEFINITIONS.map((region) => (
                        <Tag.CheckableTag
                          key={region.regionType}
                          checked={selectedRegions.includes(region.regionType)}
                          onChange={(checked) => {
                            if (checked) {
                              setSelectedRegions((prev) => [
                                ...prev,
                                region.regionType,
                              ]);
                            } else {
                              setSelectedRegions((prev) =>
                                prev.filter((r) => r !== region.regionType),
                              );
                            }
                          }}
                        >
                          {region.name}
                        </Tag.CheckableTag>
                      ))}
                    </Space>
                  </div>
                </div>

                <Space>
                  <Button onClick={() => setCurrentStep("config")}>
                    <ArrowLeftOutlined /> 返回配置
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    icon={<RocketOutlined />}
                    onClick={() => {
                      setCurrentStep("preview");
                      handleGenerate();
                    }}
                    loading={isGenerating}
                    disabled={!prompt.trim()}
                  >
                    {isGenerating ? "生成中..." : "生成页面"}
                  </Button>
                </Space>
              </Space>
            </Card>
          </div>
        </div>
      )}

      {/* ==================== Step 3: Preview ==================== */}
      {currentStep === "preview" && (
        <div className="ai-page-generator__preview-layout">
          {/* Preview Panel */}
          <div className="ai-page-generator__preview-main">
            <Card
              title={
                <Space>
                  <span>页面预览</span>
                  {isGenerating && (
                    <Tag color="processing" icon={<LoadingOutlined />}>
                      生成中...
                    </Tag>
                  )}
                  {generationError && (
                    <Tag color="error">生成出错</Tag>
                  )}
                </Space>
              }
              extra={
                !isGenerating &&
                pageData && (
                  <Space>
                    <Button
                      icon={<EditOutlined />}
                      onClick={() => setCurrentStep("prompt")}
                    >
                      修改需求
                    </Button>
                    <Button
                      type="primary"
                      icon={<RocketOutlined />}
                      onClick={handleLoadIntoEditor}
                    >
                      载入编辑器
                    </Button>
                  </Space>
                )
              }
              className="ai-page-generator__preview-card"
            >
              {/* Region stream */}
              {regions.length === 0 && isGenerating && (
                <div style={{ textAlign: "center", padding: "60px 0" }}>
                  <Spin size="large" />
                  <div style={{ marginTop: 16 }}>
                    <Text type="secondary">AI 正在分析需求并规划页面结构...</Text>
                  </div>
                </div>
              )}

              {regions.length === 0 && !isGenerating && generationError && (
                <Result
                  status="error"
                  title="生成失败"
                  subTitle={generationError}
                  extra={[
                    <Button
                      key="retry"
                      type="primary"
                      icon={<ReloadOutlined />}
                      onClick={handleGenerate}
                    >
                      重试
                    </Button>,
                    <Button key="back" onClick={() => setCurrentStep("prompt")}>
                      返回修改需求
                    </Button>,
                  ]}
                />
              )}

              {regions.length === 0 && !isGenerating && !generationError && (
                <div style={{ textAlign: "center", padding: "60px 0" }}>
                  <Text type="secondary">
                    点击"生成页面"开始 AI 生成
                  </Text>
                </div>
              )}

              {/* Region Preview */}
              <div className="ai-page-generator__regions">
                {regions.map((region) => (
                  <div
                    key={region.regionId}
                    className={`ai-page-generator__region ${region.status === "error" ? "error" : ""}`}
                  >
                    <div className="ai-page-generator__region-header">
                      <Space>
                        <Tag
                          color={
                            region.status === "completed"
                              ? "success"
                              : region.status === "error"
                                ? "error"
                                : "processing"
                          }
                        >
                          {region.status === "completed"
                            ? "✓"
                            : region.status === "error"
                              ? "✗"
                              : "..."}
                        </Tag>
                        <Text strong>{region.name}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          ({region.regionType})
                        </Text>
                      </Space>
                      {region.status === "error" && (
                        <Button size="small" icon={<ReloadOutlined />}>
                          重试
                        </Button>
                      )}
                    </div>

                    <div className="ai-page-generator__region-content">
                      {region.status === "generating" && (
                        <Skeleton active paragraph={{ rows: 2 }} />
                      )}

                      {region.status === "completed" && region.schema && (
                        <RegionPreview schema={region.schema} />
                      )}

                      {region.status === "error" && (
                        <div className="ai-page-generator__region-error">
                          <Text type="danger">生成失败</Text>
                        </div>
                      )}

                      {region.status === "pending" && (
                        <div style={{ padding: 16, textAlign: "center" }}>
                          <Text type="secondary">等待生成...</Text>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Show gradient to indicate page is complete */}
              {!isGenerating && pageData && (
                <div className="ai-page-generator__page-complete">
                  <Alert
                    type="success"
                    showIcon
                    message="页面生成完成！"
                    description={'你可以继续通过右侧聊天窗口修改页面，或点击“载入编辑器”进行精细化编辑。'}
                  />
                </div>
              )}
            </Card>
          </div>

          {/* Chat Panel (only when page is generated) */}
          {pageData && (
            <div className="ai-page-generator__chat-panel">
              <Card
                title={
                  <Space>
                    <RobotOutlined />
                    <span>对话修改</span>
                  </Space>
                }
                className="ai-page-generator__chat-card"
              >
                <div className="ai-page-generator__chat-messages">
                  {chatMessages.length === 0 && (
                    <div className="ai-page-generator__chat-empty">
                      <RobotOutlined style={{ fontSize: 32, color: "#d9d9d9" }} />
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary">
                          输入修改需求，例如：
                        </Text>
                      </div>
                      <div style={{ color: "#999", fontSize: 13, marginTop: 4 }}>
                        "把三个特性卡片改成四个"
                        <br />
                        "将主视觉标题改为橙色"
                        <br />
                        "在底部添加一个联系表单区域"
                      </div>
                    </div>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`ai-page-generator__chat-message ${msg.role}`}
                    >
                      <div className="ai-page-generator__chat-bubble">
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="ai-page-generator__chat-message assistant">
                      <div className="ai-page-generator__chat-bubble">
                        <Spin size="small" /> 正在修改...
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="ai-page-generator__chat-input">
                  <Input.TextArea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="描述你想要的修改..."
                    rows={2}
                    onPressEnter={(e) => {
                      if (!e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSendMessage}
                    loading={chatLoading}
                    disabled={!chatInput.trim()}
                    style={{ marginTop: 8 }}
                    block
                  >
                    发送
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ==================== Config Management Modal ==================== */}
      <Modal
        title="AI 模型配置"
        open={configModalOpen}
        onCancel={() => setConfigModalOpen(false)}
        footer={
          <Space>
            <Button onClick={() => setConfigModalOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleSaveConfigFromModal}>
              保存配置
            </Button>
          </Space>
        }
        destroyOnClose
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <div>
            <Text strong>选择 LLM 提供商</Text>
            <Select
              value={config.provider}
              onChange={(val) => setConfig((prev) => ({ ...prev, provider: val }))}
              style={{ width: "100%", marginTop: 8 }}
              options={[
                { value: "deepseek", label: "DeepSeek（性价比高）" },
                { value: "openai", label: "OpenAI（GPT-4o）" },
                { value: "anthropic", label: "Anthropic Claude（Sonnet）" },
              ]}
            />
          </div>

          <div>
            <Text strong>API Key</Text>
            <Input.Password
              value={config.apiKey}
              onChange={(e) => setConfig((prev) => ({ ...prev, apiKey: e.target.value }))}
              placeholder={config.hasApiKey ? "已保存密钥，留空使用已有密钥" : "输入 API Key"}
              style={{ marginTop: 8 }}
            />
          </div>

          <div>
            <Text strong>自定义 API 地址（可选）</Text>
            <Input
              value={config.baseUrl}
              onChange={(e) => setConfig((prev) => ({ ...prev, baseUrl: e.target.value }))}
              placeholder="留空使用默认地址"
              style={{ marginTop: 8 }}
            />
          </div>

          <div>
            <Text strong>模型名称（可选）</Text>
            <Input
              value={config.model}
              onChange={(e) => setConfig((prev) => ({ ...prev, model: e.target.value }))}
              placeholder="留空使用默认模型"
              style={{ marginTop: 8 }}
            />
          </div>

          <Alert
            type="info"
            showIcon
            message="API Key 仅存储在您的账户中，不会分享给他人。"
          />
        </Space>
      </Modal>
    </div>
  );
};

/* ==================== Region Preview Component ==================== */

const RegionPreview: React.FC<{ schema: Record<string, unknown> }> = ({
  schema,
}) => {
  const type = schema.type as string;
  const props = schema.props as Record<string, unknown> | undefined;
  const children = schema.children as Array<Record<string, unknown>> | undefined;
  const regionType = schema.regionType as string | undefined;

  const style = props?.style as Record<string, string> | undefined;
  const styleStr = style
    ? Object.entries(style)
        .map(([k, v]) => `${k.replace(/([A-Z])/g, "-$1").toLowerCase()}:${v}`)
        .join(";")
    : "";

  // Generate a simplified preview HTML
  const previewHtml = useMemo(() => {
    return renderSimplePreview(schema);
  }, [schema]);

  return (
    <div
      className="region-preview"
      style={{
        border: "1px dashed #d9d9d9",
        borderRadius: 4,
        padding: 8,
        overflow: "auto",
        maxHeight: 300,
      }}
    >
      <div
        className="region-preview__content"
        dangerouslySetInnerHTML={{ __html: previewHtml }}
      />
    </div>
  );
};

function renderSimplePreview(
  node: Record<string, unknown>,
  depth = 0,
): string {
  if (depth > 5) return "";

  const type = node.type as string;
  const props = node.props as Record<string, unknown> | undefined;
  const children = node.children as Array<Record<string, unknown>> | undefined;
  const style = props?.style as Record<string, string | number> | undefined;

  const bgColor = style?.backgroundColor || style?.["background-color"] || "";
  const padding = style?.padding || "";
  const textAlign = style?.textAlign || style?.["text-align"] || "";
  const color = style?.color || "";
  const fontSize = style?.fontSize || style?.["font-size"] || "";

  const inlineStyle = [
    bgColor ? `background:${bgColor}` : "",
    padding ? `padding:${typeof padding === "number" ? `${padding}px` : padding}` : "",
    textAlign ? `text-align:${textAlign}` : "",
    color ? `color:${color}` : "",
    fontSize ? `font-size:${typeof fontSize === "number" ? `${fontSize}px` : fontSize}` : "",
    type === "row" ? "display:flex;flex-wrap:wrap;gap:8px" : "",
    type === "column" ? "flex:1;min-width:120px" : "",
    type === "spacer" ? `height:${(props?.height as number) || 40}px` : "",
    type === "divider" ? "border-top:1px solid #e8e8e8;margin:8px 0" : "",
  ]
    .filter(Boolean)
    .join(";");

  const styleAttr = inlineStyle ? ` style="${inlineStyle}"` : "";

  switch (type) {
    case "text": {
      const as = (props?.as as string) || "p";
      const content = (props?.content as string) || "";
      return `<${as}${styleAttr} class="preview-text">${escapeSimple(content)}</${as}>`;
    }
    case "image": {
      const src = (props?.src as string) || "";
      const alt = (props?.alt as string) || "";
      return src
        ? `<img src="${escapeSimple(src)}" alt="${escapeSimple(alt)}" style="max-width:100%;max-height:150px;border-radius:4px" />`
        : `<div${styleAttr} class="preview-placeholder">🖼 图片</div>`;
    }
    case "button": {
      const text = (props?.text as string) || "按钮";
      return `<button${styleAttr} class="preview-button">${escapeSimple(text)}</button>`;
    }
    case "card": {
      const title = (props?.title as string) || "";
      const desc = (props?.description as string) || "";
      return `<div style="border:1px solid #eee;border-radius:8px;padding:12px;background:#fff;${inlineStyle}">
        ${title ? `<h4 style="margin:0 0 4px">${escapeSimple(title)}</h4>` : ""}
        ${desc ? `<p style="margin:0;color:#666;font-size:13px">${escapeSimple(desc)}</p>` : ""}
      </div>`;
    }
    case "container":
    case "section":
    case "row":
    case "column":
    case "div": {
      if (children && children.length > 0) {
        const childrenHtml = children
          .map((c) => renderSimplePreview(c, depth + 1))
          .join("\n");
        return `<div${styleAttr} class="preview-container">${childrenHtml}</div>`;
      }
      return `<div${styleAttr} class="preview-container"></div>`;
    }
    default: {
      if (children && children.length > 0) {
        const childrenHtml = children
          .map((c) => renderSimplePreview(c, depth + 1))
          .join("\n");
        return `<div${styleAttr} class="preview-container" data-type="${escapeSimple(type)}">${childrenHtml}</div>`;
      }
      return `<div${styleAttr} class="preview-container" data-type="${escapeSimple(type)}">[${escapeSimple(type)}]</div>`;
    }
  }
}

function escapeSimple(text: string): string {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

import "./index.less";

export default AiPageGenerator;
