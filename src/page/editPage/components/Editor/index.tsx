import React, { useEffect, useState, } from 'react'
import { Button, Input } from 'antd'
import ApiBlog from '@/api/apiBlog'
import Cookies from "js-cookie"
import BraftEditor from 'braft-editor'
import CodeHighlighter from 'braft-extensions/dist/code-highlighter';
import './style.scss'
import 'braft-editor/dist/index.css';
import 'braft-extensions/dist/code-highlighter.css';

const options = {
  them: "dark",
  includeEditors: ['editor-with-code-highlighter']
}
BraftEditor.use(CodeHighlighter(options))
interface IProps {
  /** 文章id */
  id?: string;
  title?: string;
  content?: string
}


const blankEditorVal = BraftEditor.createEditorState(null);

const Editor = ({ id, title: defaultTitle, content }: IProps) => {
  const [title, setTitle] = useState(defaultTitle);
  const [editorVal, setEtitorVal] = useState(BraftEditor.createEditorState(content))

  const onInputChange = (e: any) => {
    const val = e.target.value.replace(/(^\s*)|(\s*$)/g, "");
    setTitle(val);
  }

  const handleEditorChange = (content: any) => {
    setEtitorVal(content);
  }
  // 保存
  const onSave = () => {
    const htmlContent = editorVal.toHTML()
    let pathName = location.pathname
    if (pathName.indexOf('addArticle') === -1) {
      updateEditorContent(htmlContent)
    } else {
      addEditorContent(htmlContent)
    }
  }
  const updateEditorContent = async (htmlContent: string) => {

    let desc = editorVal.toRAW(true).blocks[0].text
    let params = {
      id,
      title,
      description: desc,
      content: htmlContent
    }
    await ApiBlog.updateArticle(params)
  }
  //添加文章
  const addEditorContent = async (htmlContent: string) => {
    const desc = editorVal.toRAW(true).blocks[0].text
    let params = {
      userId: Cookies.get('userId') || 1,
      author: Cookies.get('userName'),
      title,
      description: desc,
      content: htmlContent
    }
    try {
      await ApiBlog.addArticle(params);
    } catch (error: any) {
      console.error('add article error', error.message);
    }
  }
  const onClearText = () => {
    setEtitorVal(blankEditorVal);
  }

  return <div className='edit-content'>
    <div className='title-container'>
      <Input
        className='title-input'
        onChange={onInputChange}
        onFocus={() => {
          if (title === '新建文本标题') setTitle('');
        }}
        value={title}
        placeholder="文章标题" />
    </div>
    <BraftEditor
      id="editor-with-code-highlighter"
      value={editorVal}
      onChange={handleEditorChange}
      onSave={onSave}
      placeholder='请输入正文内容'
    />
    <div className='save-footer'>
      <Button onClick={onClearText}>清空</Button>
      <Button style={{ marginLeft: 25 }} type='primary' onClick={onSave}>保存</Button>
    </div>
  </div>
}
export default Editor;