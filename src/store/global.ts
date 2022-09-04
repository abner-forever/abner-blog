import { observable, action, runInAction, makeObservable } from 'mobx'
import ApiBlog from '@/api/apiBlog';
import Cookies from "js-cookie";

class GlobalStore {
  @observable userInfo: any = null;
  @action
  getUserInfo = async () => {
    let userId = Cookies.get("userId");
    if(!userId) return;
    let res = await ApiBlog.getUserInfo({ userId })
    runInAction(() => {
      this.userInfo = res;
    })
  }
  constructor() {
    makeObservable(this)
    this.getUserInfo();
  }
}
export default new GlobalStore()