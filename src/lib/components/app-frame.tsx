import React, { useState, SyntheticEvent, useCallback } from 'react';
import './app-frame.css';
import "animate.css";
import ReactCSSTransitionGroup from "react-addons-css-transition-group";

import { Tooltip } from 'antd'
import { ReloadOutlined, CloseOutlined } from '@ant-design/icons'

const AppFrame = React.forwardRef<HTMLIFrameElement, { [key: string]: any }>((props, ref) => {
    const { url } = props;
    const [ name ] = useState(Math.random() + '')

    const onLoad = (event: SyntheticEvent) => {
        if (props.onLoad) {
            props.onLoad();
        }
    }
    const onClose = () => {
        if (props.onClose) {
            props.onClose();
        }
    }
    const onReload = useCallback(() => {
        window.open(url, name, '')
    }, [url, name]);

    return (
        <ReactCSSTransitionGroup
            transitionEnter={true}
            transitionLeave={true}
            transitionEnterTimeout={2500}
            transitionLeaveTimeout={1500}
            transitionName="animated"
        >
            <div className="animated zoomInUp faster app-frame">
                <iframe ref={ref} src={url} onLoad={onLoad} title=" " name={name} />
                <div className="tools">
                    <Tooltip title="刷新">
                        <span className="tool" onClick={onReload}>
                            <ReloadOutlined />
                        </span>
                    </Tooltip>
                    <Tooltip title="关闭">
                        <span className="tool" onClick={onClose}>
                            <CloseOutlined />
                        </span>
                    </Tooltip>
                </div>
            </div>
        </ReactCSSTransitionGroup>
    )
})

export default AppFrame;