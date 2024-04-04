import React from 'react'
import ApiBlog from '@/services/apiBlog'
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import PasswordForm from '@/components/AuthForm/PasswordForm';
import useStore from '@/hooks/useStore';
import './styles.less'
/**
 * 登录页面
 * @param props 
 * @returns 
 */
const Login = () => {
  const { global } = useStore();
  const navigate = useNavigate();
  const onLogin = async ({ username, password }: any) => {
    try {
      let res: any = await ApiBlog.login({
        username,
        password
      })
      if (res && res.token) {
        message.success("登录成功");
        global.isLogin = true;
        navigate('/admin', {
          replace: true
        });
      }
    } catch (error: any) {
      message.error(error.message)
    }
  }
  return (
    <div className='content-item login-page'>
      <p className='title' >用户登录</p>
      <PasswordForm onSubmit={onLogin}/>
    </div>
  )
}
export default Login;