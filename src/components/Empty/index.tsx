import React from 'react'
import './style.scss'
const Empty = ({title='暂无数据'}:any) => {
    return (
        <div className='empty-cont'>
            <p>{title}</p>
        </div>
    )
}
export default Empty