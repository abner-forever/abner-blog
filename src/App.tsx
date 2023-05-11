import React, { Component } from 'react';
import { ConfigProvider } from 'antd';
import { Provider } from 'mobx-react';
import AppRouter from "./routes";
import store from './store'

// ConfigProvider.config({
//   theme: {
//     primaryColor: '#009a61',
//   },
// });
const ANIMATION_MAP: any = {
  PUSH: 'forward',
  POP: 'back'
};
class App extends Component {

  render() {
    return (
      <Provider {...store}>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#009a61',
              borderRadius: 4,
              boxShadow: 'none'
            },
          }}
        >
          <AppRouter />
        </ConfigProvider>
      </Provider>
    );
  }
}

export default App;
