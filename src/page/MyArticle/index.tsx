import React, { useEffect, useState } from 'react'
import './style.scss'
import { ItemCard } from '@/components'
import ApiBlog from  '@/api/apiBlog'
import Cookies from "js-cookie"

const MyArticle = (props:any) => {
    const [articleList, setArticleList] = useState([]);
    useEffect(() => {
        init()
    },[])
    const init = async () => {
        let userId = Cookies.get('user-id')
        console.log('userId',userId);
        
        let res:any = await ApiBlog.getMyArticleList({
            userId
        })
        setArticleList(res)
        
    }
    //删除某一条数据
    const deleteArticle = async (id:string)=>{
        await ApiBlog.removeArticle({
            id
        })
        let newlist: any = []
        articleList.forEach((item:any)=>{
            if(item.id !== id){
                newlist.push(item)
            }
        })
        setArticleList(newlist)
    }
    return (
        <div className='content-item'>
            {
                articleList.length>0 && articleList.map((item, index) => (
                    <ItemCard
                        key={index}
                        item={item}
                        isEdit={true}
                        deleteArticle={deleteArticle}
                    />
                ))
            }
        </div>
    )
}
export default MyArticle