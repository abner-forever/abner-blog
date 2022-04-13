import React from "react";

import demoComponents from './components'

const Demo = ()=>{
    console.log('DemoComponent',demoComponents);
    
    return <div>
        Demo
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