import React from 'react'
import BraftEditor from 'braft-editor'
import dayjs from 'dayjs'
import 'braft-editor/dist/output.css'
import 'braft-extensions/dist/code-highlighter.css'
import './style.scss';


import CodeHighlighter from 'braft-extensions/dist/code-highlighter'
let options = {
    them: "dark",
    includeEditors: ['editor-with-code-highlighter'],
}
BraftEditor.use(CodeHighlighter(options))

//文章详细信息
const ArticleDetail = ({editArticle}:any) => {

    const { title, content, userName = '佚名', updateTime, createTime } = editArticle || {}
    const htmlContent = content;
    const _createTime  = dayjs(updateTime || createTime).format('YYYY-MM-DD HH:MM')
    return (
        <div className='detail-content'>
            <p className="detail-title">{title}</p>
            <div className='title-desc'>
                <span>作者：{userName}</span>
                <span style={{ marginLeft: 8 }}> 发布于：{_createTime}</span>
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