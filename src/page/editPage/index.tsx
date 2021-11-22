import React from 'react'
import Editor from './components/Editor'
import { observer, inject } from 'mobx-react'
import { runInAction } from 'mobx'

interface P{
    storeArticle: any;
    location: any;
}
interface S{
    isAdd: boolean;
    count: number;
}
@inject('storeArticle')
@observer
class EditorPage extends React.Component<P,S> {
    store: any
    constructor(props:any) {
        super(props)
        this.store = this.props.storeArticle
        this.state = {
            count: 0,
            isAdd: false
        }
    }
    componentDidMount() {
        let pathName = this.props.location.pathname
        if (pathName.indexOf('addArticle') === -1) {
            let articleId = this.props.location.pathname.replace('/edit/', '')
            this.store.onGetEditText(articleId)

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
                {(this.store.editArticle || this.state.isAdd) && <Editor
                    editArticle={this.store.editArticle}
                    // count={this.state.count}
                    location={this.props.location}
                />}
            </>
        )

    }
}
export default EditorPage
