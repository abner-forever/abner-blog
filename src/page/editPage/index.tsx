import React from 'react'
import Editor from './components/Editor'
import { observer, inject } from 'mobx-react'
import { runInAction } from 'mobx'
import ApiBlog from "@/api/apiBlog";
import { getEndofUrlPath } from '@/utils';

interface P {
    storeArticle: any;
    location: any;
}
interface S {
    isAdd: boolean;
    count: number;
    editArticle: any;
}
@inject('storeArticle')
@observer
class EditorPage extends React.Component<P, S> {
    store: any
    constructor(props: any) {
        super(props)
        this.store = this.props.storeArticle
        this.state = {
            count: 0,
            isAdd: false,
            editArticle: null,
        }
    }
    getArticleDetail = async () => {
        const id = getEndofUrlPath(this.props.location.pathname);
        let res: any = await ApiBlog.getArticleDetail({ id });
        this.setState({
            editArticle:res,
        })
    };
    componentDidMount() {
        let pathName = this.props.location.pathname
        if (pathName.indexOf('add-article') === -1) {
            this.getArticleDetail();
        } else {
            runInAction(() => {
                this.store.editArticle = ''
            })
            this.setState({
                isAdd: true
            })
        }

    }
    render() {
        return (
            <>
                {(this.state.editArticle || this.state.isAdd) && <Editor
                    editArticle={this.state.editArticle}
                    location={this.props.location}
                />}
            </>
        )

    }
}
export default EditorPage
