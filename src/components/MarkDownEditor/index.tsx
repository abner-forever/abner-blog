import React, { useState,useCallback, useEffect } from "react";
import SimpleMDE from "react-simplemde-editor";
import * as marked from 'marked';
import Prism from 'prismjs';
import Cookies from "js-cookie"
import ApiBlog from '@/services/apiBlog'
import { Button } from "antd";
import hljs from "highlight.js"; // 引入 highlight.js
import "easymde/dist/easymde.min.css";
// import loadLanguages from 'prismjs/components/index';
import 'prismjs/themes/prism-okaidia.css';
import { log } from "console";

// loadLanguages([
//     'css',
//     'javascript',
//     'bash',
//     'git',
//     'ini',
//     'java',
//     'json',
//     'less',
//     'markdown',
//     'php',
//     'php-extras',
//     'python',
//     'jsx',
//     'tsx',
//     'less',
//     'sql',
//     'vim',
//     'yaml',
// ]);

const MarkDownEditor = () => {
    const [mdValue, setMdValue] = useState('');
    const onChange = useCallback(async (value: string) => {
        setMdValue(value);
      }, []);

      useEffect(()=>{
        
        
      },[])

    const renderMarkdown = (text: string) => {
        var rendererMD = new marked.Renderer();
        // marked.setOptions({
        //     renderer: rendererMD,
        //     highlight: (code:string)=> {
        //       return hljs.highlightAuto(code).value;
        //     },
        //     pedantic: false,
        //     gfm: true,
        //     breaks: false,
        //     sanitize: false,
        //     smartLists: true,
        //     smartypants: false,
        //     xhtml: false
        //   });
        const html = text;
       
        console.log('html',html);
        
        if (/language-/.test(html)) {
            const container = document.createElement('div');
            container.innerHTML = html;
            Prism.highlightAllUnder(container);
            return container.innerHTML;
        }
        return html;
    };
    const options: any = {
        spellChecker: false,
        autofocus: true,
        previewRender: renderMarkdown, // 自定义预览渲染
        toolbar: [
            'bold',
            'italic',
            'heading',
            '|',
            'quote',
            'code',
            'table',
            'horizontal-rule',
            'unordered-list',
            'ordered-list',
            '|',
            'link',
            'image',
            '|',
            'side-by-side',
            'fullscreen',
            '|',
            'guide',
            {
                name: 'guide',
                action () {
                  const win = window.open(
                    'https://github.com/riku/Markdown-Syntax-CN/blob/master/syntax.md',
                    '_blank',
                  );
                  if (win) {
                    // Browser has allowed it to be opened
                    win.focus();
                  }
                },
                title: 'Markdown 语法！',
              }
        ]
    }
    const onSave = async ()=>{
        let params = {
            userId: Cookies.get('userId')||'1',
            author: Cookies.get('userName'),
            title: 'articleTitle',
            description: 'desc',
            content: mdValue
        }
        try {
            await ApiBlog.addArticle(params);
            // commonStore.location.history.replace('/')
        } catch (error) {
            console.error('add error', error);
            
        }
    }

    return <div>
        <SimpleMDE
            value={mdValue}
            onChange={onChange}
            options={options}
            getMdeInstance={(simplemde: any) => {
                simplemde = simplemde;
            }}
            // uploadOptions={upLoad}
        />
        <div className='save-footer'>
      <Button style={{ marginLeft: 25 }} type='primary' onClick={onSave}>保存</Button>
    </div>
    </div>
};
export default MarkDownEditor;