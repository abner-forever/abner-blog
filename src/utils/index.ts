export default class Commutils {
  static buildRequestUrl(url: string, params: Record<string, string>) {
    let param = "";
    for (let key in params) {
      param = param + "&" + key + "=" + params[key];
    }
    return url + "?" + param;
  }
}
/**
 * 获取url路径最后一段
 * @param url 
 */
export const getEndofUrlPath = (url: string): string => {
  return url.substring(url.lastIndexOf('/') + 1)
}
// export const useFetch = (config, deps) => {
//     const abortController = new AbortController()
//     const [loading, setLoading] = useState(false)
//     const [result, setResult] = useState()

//     useEffect(() => {
//       setLoading(true)
//       fetch({
//         ...config,
//         signal: abortController.signal
//       })
//         .then((res) => setResult(res))
//         .finally(() => setLoading(false))
//     }, deps)

//     useEffect(() => {
//       return () => abortController.abort()
//     }, [])

//     return { result, loading }
//   }
