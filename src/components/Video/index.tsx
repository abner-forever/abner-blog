import React from 'react';
import './style.scss'
// 你好，李焕英准高清
// http://api.xosxx.com/hls/playA.php?vid=qGfJeztPsOO0OO1hMNBiltxhIv8GQszrbV1sNDMWuE84HwmweVvL0jmDOO0OO9x7Xdh319ir

// 唐人街探案3准高清

const Video = () => {
    // let bilibiliUrl = 'blob:https://www.bilibili.com/4ccec2a1-d8df-4f87-b596-d157081c5093'
    let tangTan = 'http://api.xosxx.com/hls/playA.php?vid=O000O2OO0OO1faeOO0OOQULk86C7JioEOvzDdvfbDkSWM2DBxlyUW7WU3oO000Ou1vvqO000OwQryWPaGMMD'
    return (
        <>
            <p>demo</p>
            <video className='video' src={tangTan}></video>
        </>
    )
}

export default Video