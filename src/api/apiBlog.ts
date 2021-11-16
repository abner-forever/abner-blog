import Fetch from "./request";
import upLoad from "./upload";
class ApiBlog {
  /**
   * 博客列表数据
   */
  apiArticleList = (params?: any) => {
    return upLoad.get("/api/article/articleList", params);
  };
  getMyArticleList = (params:any) => {
    return Fetch.get("/api/article/myarticleList", params);
  };
  /**
   * 博客详情页
   */
  apiArticleOne = (params:any) => {
    return Fetch.get("/api/article/getArticle", params);
  };
  /**
   * 添加文章评论
   */
  addComment = (params:any) => {
    return Fetch.post("/api/article/addComment", params);
  };
  /**
   * 删除文章评论
   */
  removeComment = (params:any) => {
    return Fetch.post("/api/article/removeComment", params);
  };
  /**
   * 获得文章评论
   */
  getCommentList = (params:any) => {
    return Fetch.get("/api/article/getArticleComments", params);
  };

  /**
   * 更新文章
   * /api/article/updateArticle
   */
  updateArticle = (params:any) => {
    return Fetch.post("/api/article/updateArticle", params);
  };
  /**
   * 更新文章
   * /api/article/updateArticle
   */
  addArticle = (params:any) => {
    return Fetch.post("/api/article/addArticle", params);
  };

  removeArticle = (params:any) => {
    return Fetch.post("/api/article/removeArticle", params);
  };
  //登录
  login = (params:any) => {
    return Fetch.post("/api/users/login", params);
  };
  //注册
  register = (params:any) => {
    return Fetch.post("/api/users/register", params);
  };
  uploadHead = (params:any) => {
    return upLoad.post("/api/users/head", params);
  };
  //用户信息
  userInfo = (params: any, type?: string) => {
    return Fetch.get("/api/users/userinfo", params);
  };
}

export default new ApiBlog();
