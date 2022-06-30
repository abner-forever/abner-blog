import React, { Component } from 'react';
import {Provider } from 'mobx-react'
import Store from './store'
import Page from './page'

class App extends Component {
  render() {
    console.log('log test');
    return (
       <Provider {...Store}>
         <Page/>
       </Provider>
    );
  }
}
 
export default App;
