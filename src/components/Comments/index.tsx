import React, { useState, useEffect } from 'react'
import ApiBlog from '@/api/apiBlog'
import { Button, Input, message } from 'antd'
import Cookies from "js-cookie";
import './style.scss'
import { DEFAULT_HEAD } from '@/constant';

/**
 * 评论组件
 */
const Comments = ({id}:any) => {
    // const [iscommentShow, setiscommentShow] = useState(true)
    const [commentList, setCommentList] = useState([])
    const [comment, setComment] = useState('')
    let userId = Cookies.get('userId')
    useEffect(() => {
        getCommentList(); // eslint-disable-next-line 
    }, [])

    const getCommentList = async () => {
        let res: any = await ApiBlog.getCommentList({ id });
        setCommentList(res)
    }
    
    const addComment = async () => {

        if (!userId) {
            message.warn('请登录后再评论');
            return;
        }
        let params = {
            userId: userId,
            content: comment,
            postid: id,
        }
        await ApiBlog.addComment(params);
        getCommentList();
        setComment('')
    }
    const onRemoveComment = async (id:string) => {
        await ApiBlog.removeComment({ id });
        let newCommentList = commentList.filter((item:any) => item.id !== id)
        setCommentList(newCommentList)
    }
    return (
        <div className='comment-box'>
            <div className="commnt-input">
                <div>
                    <img src="" alt="" />
                </div>
                <div className='input-box'>
                    <Input placeholder='输入评论...' type="text" value={comment} onChange={(e) => { setComment(e.target.value) }} />
                    <Button type={'primary'} disabled={!comment} onClick={addComment}>评论</Button>
                </div>
            </div>
            <div className='comment-list'>
                {
                    commentList.length > 0 ? commentList.map((item:any, index) => (
                        <div className='comment-item' key={index}>
                            <div className='user-icon'>
                                <img src={item.avator|| DEFAULT_HEAD} alt="" />
                            </div>
                            <div className='comment-detail'>
                                <span className='user-name'>{item.userName}</span>
                                <p className='comments'>{item.content}</p>
                                {userId === String(item.userId) && <span className='remove-icon' onClick={() => onRemoveComment(item.id)}>删除</span>}
                            </div>
                        </div>
                    )) : <div className='no-comment'>暂无评论</div>
                }
            </div>
        </div>
    )
}
export default Comments
