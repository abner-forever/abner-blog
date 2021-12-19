import { observable, action,runInAction } from 'mobx'
import ApiBlog from  '@/api/apiBlog'
class Article {
   @observable articleList = []
   @observable editText = ''
   @observable editArticle = null
   @observable isModalVisible = false

   @action onGetEditText = async (id:any) => {
      let res:any = await ApiBlog.getArticleDetail({
         id:id
      })
      runInAction(()=>{
         this.editArticle = res
      })
   }
   @action
   onGetArticle = async() => {
      let res:any = await ApiBlog.apiArticleList()
      runInAction(()=>{
         this.articleList = res.list||[]
      })
   }
}
export default new Article()