import React, { useState, useEffect, memo } from 'react'
import defaultImg from '@img/default.png'
import './styles.less'
const WallPaper = () => {
    let [imgUrl, setImgurl] = useState('')
    let size = { width: '100%', height: 'auto' }
    const getImage = () => {
        let url = `https://infinity-api.infinitynewtab.com/random-wallpaper?_=${Date.now()}`
        fetch(url).then(response => response.json()).then((res) => {
            setImgurl(res.data[0].src.mediumSrc || res.data[0]?.src?.rawSrc)
        })
    }
    useEffect(() => {
        if (imgUrl === '') {
            getImage()
        }
    }, [imgUrl])
    return (
        <>
            <div className='wall-paper' style={{ backgroundImage: `url(${defaultImg})` }} >
                <img style={{ ...size }} src={imgUrl} alt='' />
            </div>
            <div className='change-btn' onClick={() => {
                getImage()
            }}>
                换一张
        </div>
        </>
    )
}
export default memo(WallPaper)