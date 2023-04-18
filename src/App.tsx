import React, { Component } from 'react';
import { ConfigProvider } from 'antd';
import { Provider } from 'mobx-react';

import AppRouter from "./routes";
import store from './store'

ConfigProvider.config({
  theme: {
    primaryColor: '#009a61',
  },
});

class App extends Component {

  render() {
    return (
      <Provider {...store}>
          <AppRouter />
      </Provider>
    );
  }
}

export default App;
