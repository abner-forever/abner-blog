import React from "react";

import demoComponents from './components'

const Demo = ()=>{
    console.log('DemoComponent',demoComponents);
    
    return <div>
        Demo
        {
            demoComponents.map((item,index)=>(
                // <div key={index}>
                //     {}
                // </div>
                item()
            ))
        } 
    </div>
}
export default Demo;