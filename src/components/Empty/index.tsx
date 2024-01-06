import React from 'react'
import './styles.less'
const Empty = ({title='暂无数据'}:any) => {
    return (
        <div className='empty-cont'>
            <p>{title}</p>
        </div>
    )
}
export default Empty