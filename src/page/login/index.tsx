import React, { useState, useEffect } from 'react'
import ApiBlog from '@/services/apiBlog'
import Cookies from "js-cookie"
import { Button, message, Upload, Input, Form } from 'antd';
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import ImgCrop from 'antd-img-crop'
import './style.less'
import { useNavigate } from 'react-router-dom';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
/**
 * 登录页面
 * @param props 
 * @returns 
 */
const Login = (props: any) => {
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true)
  const [checkPassword, setCheckPassword] = useState('')
  const [buttonDisable, setButtonDisable] = useState(true)
  const [fileList, setFileList] = useState<any>([])
  const navigate = useNavigate();

  const login = async () => {

  }

  useEffect(() => {
  })
  const beforeUpload = (file: any) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('You can only upload JPG/PNG file!');
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Image must smaller than 2MB!');
    }
    setFileList([...fileList, file])
    getImgBase64Data(file, (url: string) => {
      setImageUrl(url)
    })
    return false;
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
      fetch('/dev_api/users/head', {
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


  const onLogin = async ({ userName, password }: any) => {
    try {
      let res: any = await ApiBlog.login({
        userName,
        password
      })
      if (res && res.token) {
        let currentCookieSetting = {
          expires: 1
        }
        Object.assign(currentCookieSetting, {})
        Cookies.set('user-token', res.token, currentCookieSetting)
        Cookies.set('userId', res.userId, currentCookieSetting)
        Cookies.set('userName', res.userName, currentCookieSetting)
        message.success("登录成功")
        navigate('/admin', {
          replace: true
        })
      }
    } catch (error: any) {
      message.error(error.message)
    }
  }

  const onLoginFailed = () => {

  }

  const loginForm = () => {
    return (
      <Form
        name="login"
        // labelCol={{ span: 8 }}
        wrapperCol={{ span: 24 }}
        style={{ maxWidth: 600 }}
        initialValues={{ remember: true }}
        onFinish={onLogin}
        onFinishFailed={onLoginFailed}
        autoComplete="off"
        className='login-form'
      >

        <Form.Item
          // label="账号"
          name="userName"
          rules={[{ required: true, message: '请输入账号' }]}
        >
          <Input prefix={<UserOutlined />} placeholder='请输入账号' className='input-item' />
        </Form.Item>
        <Form.Item
          // label="密码"
          name="password"
          rules={[{ required: true, message: '请输入密码' }]}
        >
          <Input prefix={<LockOutlined />} placeholder='请输入密码' className='input-item' />
        </Form.Item>
        <Button type="primary" size='large' className='button' htmlType='submit'>登录</Button>
      </Form>
    )
  }
  const registerForm = () => {
    return (
      <div>
        <label htmlFor="head" title='头像'>
          <span>头像</span>
          <ImgCrop>
            <Upload
              name="avator"
              listType="picture-card"
              className="avator-uploader"
              showUploadList={false}
              beforeUpload={beforeUpload}
              fileList={fileList}
              onRemove={removeImg}
            >
              {imageUrl ? <div className='head-image'>
                <img src={imageUrl} alt="avator" style={{ width: '100%' }} />
              </div> : uploadButton}
            </Upload>
          </ImgCrop>
        </label>
        <div className='form-input'>
          <Form.Item
            label="账号"
            name="userName"
            rules={[{ required: true, message: '请输入账号' }]}
          >
            <Input className='input-item'
              placeholder='请输入账号' />
          </Form.Item>
          <Form.Item
            label="账号"
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input className='input-item' placeholder='请输入密码' />
          </Form.Item>
          <Form.Item
            label="账号"
            name="checkPassWord"
            rules={[{ required: true, message: '再次确认密码' }]}
          >
            <Input className='input-item' placeholder='再次确认密码' />
          </Form.Item>
        </div>
        <div className='form-submit'>
          <Button disabled={buttonDisable} type={'primary'} >注册</Button>
        </div>
      </div>
    )
  }
  return (
    <div className='content-item login-page'>
      <p className='title' >用户登录</p>
        {
          isLogin ? loginForm() : registerForm()
        }
      <p className='login-tips' onClick={() => {
        setIsLogin(!isLogin);
      }}>{isLogin ? '没有账号？去注册' : '有账号，去登录'}</p>
    </div>
  )
}
export default Login;