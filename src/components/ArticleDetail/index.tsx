import React from 'react'
import BraftEditor from 'braft-editor'
import dayjs from 'dayjs'
import 'braft-editor/dist/output.css'
import 'braft-extensions/dist/code-highlighter.css'
import './styles.less';


import CodeHighlighter from 'braft-extensions/dist/code-highlighter'
import Iconfont from '../Iconfont'

let options = {
  them: "dark",
  includeEditors: ['editor-with-code-highlighter'],
}

BraftEditor.use(CodeHighlighter(options))

//文章详细信息
const ArticleDetail = ({ editArticle }: any) => {

  const { title, content: htmlContent, author = '佚名', updateTime, createTime } = editArticle || {}
  const _createTime = dayjs(updateTime || createTime).format('YYYY-MM-DD HH:MM');
  return (
    <div className='detail-content'>
      <p className="detail-title">{title}</p>
      <div className='title-desc'>
        <span className='author' ><Iconfont type='icon-author' size={24} color='' />
          <span>{author}</span>
        </span>
        <span className='update-time'> <Iconfont type="icon-clock" size={20} color="#b4b4b4" />
        <span>{_createTime}</span>
        </span>
      </div>
      {/* 文章内容 */}
      <div
        id='editor-with-code-highlighter'
        className='articae-content braft-output-content '
        dangerouslySetInnerHTML={{ __html: BraftEditor.createEditorState(htmlContent, options).toHTML() }} />
    </div>
  )
}
export default ArticleDetail 