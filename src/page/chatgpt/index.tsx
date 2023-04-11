import React, { useState } from 'react'

import './style.less'



export default function Chatgpt() {

  const [message,setMessage] = useState('')

  const onInputChange = (e:any)=>{
    setMessage(e.target.value)
  }
  return (
    <div>
      <div className="title">
      <p>ChatGPT</p>
      <span>由 OpenAI API 提供支持</span>
      </div>
      <div className="chatgpt-input">
        <input type="text" value={message} onChange={onInputChange} />
        <button className='confirm-btn' >确认</button>
      </div>
      <p>{message}</p>
    </div>
  )
}
