import { action, configure, observable, runInAction } from 'mobx'
configure({ enforceActions: "observed" })


export class ComStore {

    @observable location: any = {}
    @observable alertTitle ='';
    @action.bound
    getHistory = (val:any) => {
        runInAction(() => {
            this.alertTitle = '提示'
            this.location = val
        })
    }
    // 获取当前页面url参数对象
    query = () => {
        let url = window.location.href
        if (url.indexOf('?') === -1) return null
        var arr1 = url.split("?");
        var params = arr1[1].split("&");
        var obj:any = {};//声明对象
        for (var i = 0; i < params.length; i++) {
            var param = params[i].split("=");
            obj[param[0]] = decodeURIComponent(params[i].substring(params[i].indexOf('=') + 1));//为对象赋值
        }
        return obj;
    }
}
const comStore = new ComStore()
export let commonStore = comStore

