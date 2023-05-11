import { observable, action, runInAction, makeObservable } from 'mobx'
import ApiBlog from '@/services/apiBlog'
class Article {
   /** 首页文章列表 */
   @observable articleList = []
   @observable editText = ''
   @observable editArticle = null
   @observable isModalVisible = false

   @action onGetEditText = async (id: any) => {
      let res: any = await ApiBlog.getArticleDetail({
         id: id
      })
      runInAction(() => {
         this.editArticle = res
      })
   }
   @action
   onGetArticle = async () => {
      let res: any = await ApiBlog.apiArticleList()
      runInAction(() => {
         this.articleList = res.list || []
      })
   }
   constructor() {
      makeObservable(this)
   }
}
export default new Article()