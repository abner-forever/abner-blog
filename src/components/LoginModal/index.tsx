import React, { useEffect, useState } from 'react'
import ApiBlog from '@/services/apiBlog'
import Cookies from "js-cookie"
import { Button, message, Form, Modal, Upload, Input } from 'antd';
import { LoadingOutlined, PlusOutlined, UserOutlined, EyeTwoTone, EyeInvisibleOutlined, LockOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from "react-router-dom";
import './styles.less'

/**
 * 登录弹窗
 * @param props 
 * @returns 
 */
const LoginModal = (props: any) => {
  const { onClose = () => { } } = props||{};
  const [username, setusername] = useState('');
  const [password, setPassword] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true)
  const [checkPassword, setCheckPassword] = useState('')
  const [buttonDisable, setButtonDisable] = useState(true)
  const [fileList, setFileList] = useState<any>([])
  const [form] = Form.useForm();
  const { search } = useLocation();
  const navigate = useNavigate();
  useEffect(()=>{
    console.log('location',search);
    // setIsLogin()
  },[])
  const onLogin = async (values: any) => {
    const { username, password } = values
   try {
    let res: any = await ApiBlog.login({
      username: username,
      password: password
    })
    if (res && res.token) {
      let currentCookieSetting = {
        expires: 1
      }
      Object.assign(currentCookieSetting, {})
      Cookies.set('user-token', res.token, currentCookieSetting)
      Cookies.set('userId', res.userId, currentCookieSetting)
      message.success("登录成功");
      onClose();
      // navigate('admin')
    }
   } catch (error:any) {
    message.error(error.message)
   }
  }
  const getImgBase64Data = (file: any, callback: Function) => {
    var reader = new FileReader();
    reader.onload = function (e: any) {
      callback(e.target.result);
    };
    reader.readAsDataURL(file); // 读取完后会调用onload方法
  }
  const uploadButton = (
    <div>
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Upload</div>
    </div>
  );
  const removeImg = (e: any) => {
    console.log('remove', e);
  }
  const uploadImg = () => {
    const formData = new FormData();
    fileList.forEach((file: any) => {
      formData.append('avator', file);
    });
    setLoading(true)
    return new Promise((resolve) => {
      fetch('/api/user/head', {
        method: "POST",
        body: formData //自动修改请求头,formdata的默认请求头的格式是 multipart/form-data
      }).then((res) => res.json()).then((res) => {
        setFileList([])
        setLoading(false)
        resolve(res.url)
      }).catch((err) => {
        message.error(`上传失败：${err}`)
      })
    })
  }

  //检查密码两次输入的密码是否一致
  const checkPasswords = (e: any) => {
    let newPassword = e.target.value.trim();
    setCheckPassword(newPassword)
    if (newPassword.length === password.length && password !== newPassword) {
      setButtonDisable(true)
      message.warning('密码不一致')
    } else {
      if (username !== '' && password === newPassword) {
        setButtonDisable(false)
      } else {
        setButtonDisable(true)
      }
    }
  }


  const LoginForm = () => {
    return (
      <Form className='modal-content'
        onFinish={onLogin}
        form={form}
      >
        <div className='form-input'>
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入账号' }]}
          >
            <Input
              type="text"
              name='username'
              value={username}
              prefix={<UserOutlined />}
              size='large'
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              placeholder='请输入密码'
              name='passWord'
              size='large'
              prefix={<LockOutlined />}
              value={password} />
          </Form.Item>

        </div>
        <Form.Item shouldUpdate>
        {() => (
          <Button
            type="primary"
            className='submit-button'
            htmlType="submit"
            disabled={
              !form.isFieldsTouched(true) ||
              !!form.getFieldsError().filter(({ errors }:any) => errors.length).length
            }
          >
            登录
          </Button>
        )}
      </Form.Item>
      </Form>
    )
  }
  return (
    <Modal
      open
      onCancel={onClose}
      centered
      title="登录"
      footer={null}
      className='login-modal'
    >
      <LoginForm />
    </Modal>

  )
}
export default LoginModal