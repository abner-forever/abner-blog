import React, { useState,useCallback } from "react";
import SimpleMDE from "react-simplemde-editor";
import marked from 'marked';
import Prism from 'prismjs';
import Cookies from "js-cookie"
import ApiBlog from '@/api/apiBlog'
import { commonStore } from '@/utils/store'

import "easymde/dist/easymde.min.css";
// import loadLanguages from 'prismjs/components/index';
import 'prismjs/themes/prism-okaidia.css';

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
//     'scss',
//     'sql',
//     'vim',
//     'yaml',
// ]);



const MarkDownEditor = () => {
    const [mdValue, setMdValue] = useState('# 你好');

    const onChange = useCallback(async (value: string) => {
        setMdValue(value);
      }, []);
    const renderMarkdown = (text: string) => {
        const html = marked(text, { breaks: true });
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
                className: 'fa fa-info-circle',
                title: 'Markdown 语法！',
              }
        ]
    }
    const onSave = async ()=>{
        let params = {
            userId: Cookies.get('userId'),
            author: Cookies.get('userName'),
            title: 'articleTitle',
            description: 'desc',
            content: mdValue
        }
        try {
            await ApiBlog.addArticle(params);
            // commonStore.location.history.replace('/')
        } catch (error) {
            console.log('add error', error);
            
        }
    }

    return <div>
        <SimpleMDE
            value={mdValue}
            onChange={onChange}
            options={options}
            // getMdeInstance={(simplemde: any) => {
            //     simplemde = simplemde;
            // }}
            // // uploadOptions={upLoad}
        />
    </div>
};
export default MarkDownEditor;