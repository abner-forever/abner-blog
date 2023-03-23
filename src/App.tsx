import React, { Component } from 'react';
import { BrowserRouter } from "react-router-dom";
// import { Provider } from 'mobx-react-lite'

import store from './store'
import AppRouter from "./routes";

class App extends Component {
  render() {
    return (
      <BrowserRouter>
        {/* <Provider {...store}> */}
          <AppRouter />
         {/* </Provider> */}
       </BrowserRouter>
    );
  }
}

export default App;
