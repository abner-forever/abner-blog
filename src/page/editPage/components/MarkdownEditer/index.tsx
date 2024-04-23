import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@/hooks";
import apiBlog from "@/services/apiBlog";
import Editor from "for-editor";
import { throttle } from "lodash";
import configs from "@/config";
import { isMobile } from "@/utils/userAgent";
import { Page } from "@/components";
import "./style.less";
import { BackwardFilled } from "@ant-design/icons";

interface MarkdownEditerProps {
  id?: number;
  title?: string;
  content?: string;
}

interface DditorParams {
  title?: string;
  description?: string;
}

const matchTitleAndDesc = (markdown: string): DditorParams => {
  const titleRegex = /^#\s(.+)/;
  const descriptionRegex = /\n(>\s.*)+/;
  const titleMatch = markdown.match(titleRegex);
  const descriptionMatch = markdown.match(descriptionRegex);
  const title = titleMatch ? titleMatch[1] : "";
  const description = descriptionMatch ? descriptionMatch[0] : "";

  return {
    title,
    description: description.split(">")[1],
  };
};

const toolbar = {
  h1: true, // h1
  h2: true, // h2
  h3: true, // h3
  h4: true, // h4
  img: true, // 图片
  link: true, // 链接
  code: true, // 代码块
  preview: !isMobile(), // 预览
  expand: !isMobile(), // 全屏
  /* v0.0.9 */
  undo: true, // 撤销
  redo: true, // 重做
  save: true, // 保存
  /* v0.2.3 */
  subfield: !isMobile(), // 单双栏模式
};

const MarkdownEditer = ({ id, content }: MarkdownEditerProps) => {
  const [markdown, setMarkdown] = useState(content);
  const [currentId, setCurrentId] = useState(id);
  const [titleAndDescription, setTitleAndDescription] = useState<DditorParams>({
    title: "未命名文章标题",
  });
  const navigate = useNavigate();
  useEffect(() => {
    const initData = () => {
      if (markdown) {
        const result = matchTitleAndDesc(markdown);
        setTitleAndDescription(result);
      }
    };
    initData();
  }, [markdown]);

  const updateMarkdown = async (content: string) => {
    setMarkdown(content);
    const { title, description } = matchTitleAndDesc(content);
    onSaveThrottled(title, description, content);
  };
  // 创建节流函数
  const onSaveThrottled = useCallback(
    throttle(async (title, description, content) => {
      if (currentId) {
        await apiBlog.updateArticle({
          id: currentId,
          title,
          description,
          content,
        });
      } else {
        const { id } = await apiBlog.addArticle({
          title,
          description,
          content,
        });
        setCurrentId(id);
        // 更新地址栏地址防止刷新不见了
      }
    }, 3000),
    [currentId]
  );
  const onChangeTitle = (e: { target: { value: string } }) => {
    const val = e.target.value;
    setTitleAndDescription({
      description: titleAndDescription?.description,
      title: val,
    });
  };

  const uploadHandler = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { url } = await apiBlog.uploadMarkdownImage(formData);
      let str = markdown + `![alt](${configs.imageServer}` + url + ")";
      setMarkdown(str);
      const { title, description } = matchTitleAndDesc(str);
      onSaveThrottled(title, description, str);
    } catch (error) {
      console.error("error", error);
    }
  };

  return (
    <Page title="编辑文档" bodyClassName="markdown-container">
      <div className="markdown-container-title-wrap">
        <input
          className="markdown-container-title"
          value={titleAndDescription?.title}
          onChange={onChangeTitle}
          placeholder="请在正文以# 开头输入标题"
          disabled
        />
        {!isMobile() && (
          <div className="markdown-container-back" onClick={() => navigate(-1)}>
            返回
            <BackwardFilled />
          </div>
        )}
      </div>
      <Editor
        subfield={true}
        preview={false}
        addImg={uploadHandler}
        value={markdown}
        onChange={updateMarkdown}
        toolbar={toolbar}
      />
    </Page>
  );
};

export default MarkdownEditer;
