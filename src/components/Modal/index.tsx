import React from "react";
import "./styles.less";

interface P {
  title: string;
  decription: string;
}
interface S {
  isShow: boolean;
}
class Modal extends React.Component<P, S> {
  constructor(props: any) {
    super(props);
    this.state = {
      isShow: true,
    };
  }
  componentDidMount() {
    setTimeout(() => {
      this.setState({
        isShow: false,
      });
    }, 3000);
  }
  render() {
    return (
      <div>
        {this.state.isShow && (
          <div className="modal-mask">
            <div className="modal-content">
              <p className="modal-title">{this.props.title}</p>
              <div>{this.props.decription}</div>
            </div>
          </div>
        )}
      </div>
    );
  }
}
export default Modal;
