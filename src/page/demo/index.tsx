import React from "react";

import demoComponents from './components'

const Demo = ()=>{
    return <div>
        {
            demoComponents.map((item,index)=>(
                <div key={index}>
                    {item()}
                </div>
            ))
        } 
    </div>
}
export default Demo;