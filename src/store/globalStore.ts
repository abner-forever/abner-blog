import { observable, action, runInAction, makeObservable } from "mobx";
import ApiBlog from "@/services/apiBlog";
import Cookies from "js-cookie";

interface UserInfo {
  id: number;
  username?: string;
  avator?: string;
}


class GlobalStore {
  @observable userInfo: UserInfo | undefined;
  @observable isLogin = false;
  @action
  getUserInfo = async () => {
    let res = await ApiBlog.requestUserInfo();
    runInAction(() => {
      this.isLogin = true;
      this.userInfo = res as UserInfo;
    });
  };
  updateUserInfo = (params: any) => {
    runInAction(() => {
      this.userInfo = {
        ...this.userInfo,
        ...params,
      };
    });
  };
  constructor() {
    makeObservable(this);
    let userToken = Cookies.get("user-token");
    if (userToken) this.getUserInfo();
  }
}
export default GlobalStore;
