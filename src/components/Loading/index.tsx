import React from 'react'
import Lottie from '@/components/Lottie';
import loadingJson from '@/assets/lottie/loading.json'

import './style.scss'

const Loading = () => {
    return (
        <div className='loading-cont'>
            <Lottie animationData={loadingJson} />
        </div>
    )
}
export default Loading