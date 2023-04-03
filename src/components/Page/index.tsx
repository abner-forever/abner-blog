import React,{ FC} from "react";
import Loading from "../Loading";

interface IProps{
  children: React.ReactNode | string;
  loading?: boolean;
  className?: string
}

export const Page:FC<IProps> = ({children, loading=false,className})=>{

  if(loading){
    return <Loading/>
  }
  return <div className={className||''}>
    {children}
  </div>
}
