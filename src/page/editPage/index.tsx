import React, { useEffect, useState } from 'react'
import Editor from './components/Editor'
import ApiBlog from "@/api/apiBlog";
import { useLocation, useParams } from 'react-router-dom';


interface ArticleType {
    title: string
    content: string;
    createTime?: string
    description?: string;
    id?: number
    updateTime?: string
}

const defaultData = {
    content: '',
    title: '新建文本标题',
}
 
const EditorPage = ( ) => {

    const [isAdd, setIsAdd] = useState(false);
    const { pathname } = useLocation();
    const { id } = useParams();
    const [editArticle,seteditArticle] = useState<ArticleType>(defaultData)
    useEffect(() => {
        if (pathname.indexOf('addArticle') === -1) {
            getArticleDetail();
        } else {
            setIsAdd(true)
        }
 
    }, []);
    const getArticleDetail = async () => {
        let res: any = await ApiBlog.getArticleDetail({ id });
        console.log('res',res);
        seteditArticle(res)
    
    };
    return (
        <>
            {(editArticle || isAdd) && <Editor
                editArticle={editArticle}
                id={id}
            />}
        </>
    )
}
export default EditorPage;
