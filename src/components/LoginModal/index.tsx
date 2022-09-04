import React, { useState } from 'react'
import ApiBlog from '@/api/apiBlog'
import Cookies from "js-cookie"
import { Button, message, Form, Modal, Upload, Input } from 'antd';
import { LoadingOutlined, PlusOutlined, UserOutlined, EyeTwoTone, EyeInvisibleOutlined } from '@ant-design/icons';
import ImgCrop from 'antd-img-crop'
import { observer, inject } from 'mobx-react';
import './style.scss'

/**
 * 登录弹窗
 * @param props 
 * @returns 
 */
const LoginModal = (props: any) => {
  const { onClose = () => { }, globalStore:{ getUserInfo} } = props;
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true)
  const [checkPassword, setCheckPassword] = useState('')
  const [buttonDisable, setButtonDisable] = useState(true)
  const [fileList, setFileList] = useState<any>([])

  const onLogin = async (values: any) => {
    const { userName, password } = values
    let res: any = await ApiBlog.login({
      userName: userName,
      password: password
    })
    if (res && res.token) {
      let currentCookieSetting = {
        expires: 1
      }
      Object.assign(currentCookieSetting, {})
      Cookies.set('token', res.token, currentCookieSetting)
      Cookies.set('userId', res.userId, currentCookieSetting)
      message.success("登录成功");
      getUserInfo();
      onClose();
    }
  }
  const register = async () => {
    if (!userName || !password) {
      message.info("用户名或密码不能为空")
      return
    }
    let url = await uploadImg();
    await ApiBlog.register({
      userName: userName,
      password: password,
      avator: url
    })
    message.success('注册成功')
    props.history.push(`/mine`)
  }
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
      fetch('/api/users/head', {
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
      message.warn('密码不一致')
    } else {
      if (userName !== '' && password === newPassword) {
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
      // onFinishFailed={onFinishFailed}
      >
        <div className='form-input'>
          <Form.Item
            label="账号"
            name="userName"
            rules={[{ required: true, message: '请输入账号' }]}
          >
            <Input
              className='input-item'
              size='small'
              // onChange={(e) => { setUserName(e.target.value) }}
              type="text"
              name='userName'
              value={userName}
              prefix={<UserOutlined />}
              placeholder='请输入账号'
            />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              placeholder='请输入密码'
              className='input-item'
              // onChange={(e) => { setPassword(e.target.value) }}
              name='passWord'
              value={password} />
          </Form.Item>

        </div>

        <Form.Item className='form-submit'>
          <Button className='submit-button' type="primary" htmlType="submit">
            登录
          </Button>
        </Form.Item>
      </Form>
    )
  }
  const RegisterForm = () => {
    return (
      <div >
        <label htmlFor="head" title='头像'>
          <span>头像</span>
          <ImgCrop
            rotate>
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
          <input placeholder='请输入账号' onChange={(e) => { setUserName(e.target.value) }} type="text" name='userName' value={userName} />
          <input placeholder='请输入密码' onChange={(e) => { setPassword(e.target.value) }} type="password" name='passWord' value={password} />
          <input placeholder='再次确认密码' onBlur={checkPasswords} onChange={checkPasswords} type="password" name='checkPassWord' value={checkPassword} />
        </div>
        <div className='form-submit'>
          <Button disabled={buttonDisable} type={'primary'} onClick={register}>注册</Button>
        </div>
      </div>
    )
  }
  return (
    <Modal
      visible
      onCancel={onClose}
      centered
      title={isLogin ? '登录' : '注册'}
      footer={null}
    >
      {isLogin ? <LoginForm /> : <RegisterForm />}
    </Modal>

  )
}
export default inject('globalStore')(observer(LoginModal));