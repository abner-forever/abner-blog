import React, { Component, } from 'react'
import { message, Button, Input } from 'antd'
import ApiBlog from '@/api/apiBlog'
import Cookies from "js-cookie"
import { commonStore } from '@/utils/store'
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
interface P {
    editArticle: any;
    location: any;
}
interface S {

}
export default class Editor extends Component<P, S> {
    state = {
        editorState: BraftEditor.createEditorState(null),
        articleTitle: this.props?.editArticle?.title || '',
    }
    componentDidMount() {
        console.log('commonStore.history',);
        const htmlContent = this.props?.editArticle?.content
        this.setState({
            editorState: BraftEditor.createEditorState(htmlContent)
        })
    }
    //点击保存
    submitContent = (editArticle: string) => {
        const htmlContent = this.state.editorState.toHTML()
        let pathName = this.props.location.pathname
        if (pathName.indexOf('addArticle') === -1) {
            this.updateEditorContent(editArticle, htmlContent)

        } else {
            this.addEditorContent(htmlContent)
        }
    }

    handleEditorChange = (editorState: any) => {
        this.setState({ editorState })
    }
    //更新文章
    updateEditorContent = async (editArticle: any, htmlContent: string) => {
        let desc = this.state.editorState.toRAW(true).blocks[0].text
        let params = {
            id: editArticle.id,
            title: this.state.articleTitle,
            description: desc,
            content: htmlContent
        }
        await ApiBlog.updateArticle(params)
        commonStore.location.history.replace('/')
    }
    //添加文章
    addEditorContent = async (htmlContent: string) => {
        const desc = this.state.editorState.toRAW(true).blocks[0].text
        let params = {
            userId: Cookies.get('userId'),
            author: Cookies.get('userName'),
            title: this.state.articleTitle,
            description: desc,
            content: htmlContent
        }
        try {
            await ApiBlog.addArticle(params);
            commonStore.location.history.replace('/')
        } catch (error) {
            console.log('add error', error);
            
        }
    }
    onInputChange = (e: any) => {
        const val =  e.target.value.replace(/(^\s*)|(\s*$)/g, ""); 
        this.setState({
            articleTitle: val
        })
    }
    _clearText = () => {
        this.setState({
            editorState: BraftEditor.createEditorState(null),
        })
    }
    componentWillUnmount() {
        this._clearText()
    }

    render() {
        const { editorState } = this.state
        const { editArticle } = this.props
        return (
            <div className="edit-content">
                <div className='title-container'>
                    <Input
                        className='title-input'
                        onChange={this.onInputChange}
                        defaultValue={this.state.articleTitle}
                        placeholder="文章标题" />
                </div>
                <div className=''>
                    <BraftEditor
                        id="editor-with-code-highlighter"
                        value={editorState}
                        onChange={this.handleEditorChange}
                        onSave={() => this.submitContent(editArticle)}
                        placeholder='请输入正文内容'
                    />
                </div>
                <div className='save-footer'>
                    <Button onClick={this._clearText}>清空</Button>
                    <Button style={{ marginLeft: 25 }} type='primary' onClick={() => this.submitContent(editArticle)}>保存</Button>
                </div>
            </div>
        )

    }

}