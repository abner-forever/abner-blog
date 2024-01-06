import React, { Component } from 'react';
import { ConfigProvider } from 'antd';
import { Provider } from 'mobx-react';
import AppRouter from "./routes";
import store from './store'
class App extends Component {

  render() {
    return (
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#009a61',
            borderRadius: 8,
            boxShadow: 'none'
          },
        }}
      >
        <Provider {...store}>
          <AppRouter />
        </Provider>
      </ConfigProvider>
    );
  }
}

export default App;
