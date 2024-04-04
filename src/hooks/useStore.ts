import React from 'react';
import store from '../store';

const useStore = () => React.useContext(store);

export default useStore;
