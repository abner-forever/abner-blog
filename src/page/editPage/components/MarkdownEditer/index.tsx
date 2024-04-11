import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import apiBlog from "@/services/apiBlog";
import Editor from "for-editor";
import { throttle } from "lodash";
import configs from "@/config";
import "./style.less";
import { isMobile } from "@/utils/userAgent";

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
    <div className="markdown-container">
      <div className="markdown-container-title-wrap">
        <input
          className="markdown-container-title"
          value={titleAndDescription?.title}
          onChange={onChangeTitle}
        />
        <div className="markdown-container-back" onClick={() => navigate(-1)}>
          返回
        </div>
      </div>
      <Editor
        subfield={true}
        preview={!isMobile()}
        addImg={uploadHandler}
        value={markdown}
        onChange={updateMarkdown}
      />
    </div>
  );
};

export default MarkdownEditer;
