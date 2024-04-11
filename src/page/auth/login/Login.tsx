import React from 'react'
import ApiBlog from '@/services/apiBlog'
import { Toast } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import PasswordForm from '@/components/AuthForm/PasswordForm';
import useStore from '@/hooks/useStore';
import './styles.less'
import { Page } from '@/components';
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
        Toast.show("登录成功");
        global.isLogin = true;
        navigate('/userCenter', {
          replace: true
        });
      }
    } catch (error: any) {
      Toast.show(error.message)
    }
  }
  return (
    <Page className='login-page'>
      <p className='title' >用户登录</p>
      <PasswordForm onSubmit={onLogin}/>
    </Page>
  )
}
export default Login;