import React from 'react';
import { ResizableBox, ResizeCallbackData } from 'react-resizable';
import { Toolbar, ToolbarProps } from './toolbar'
import { cx } from 'emotion'

export const Card = (props: any) => {
    let {attributes, children, selected, texts} = props;
    const height: number = props.height ? props.height : 200;
    const tools: ToolbarProps = props.tools || {}

    const onResizeStop = (e: React.SyntheticEvent, data: ResizeCallbackData) => {
        if (props.onResizeStop) {
            props.onResizeStop(data.size);
        }
    }
    const handle = (
        <span className="resize-handle resize-handle-s" style={{visibility: selected ? 'visible' : 'hidden'}} />
    )
    return (
        <div {...attributes} 
            onMouseDown={(event: any) => {
                let className = event.target.className;
                if( typeof className == 'string' && className.indexOf('resize-handle') >= 0)
                    event.preventDefault()
            }}             
            >
            <div contentEditable={false} className={cx(
                    'card',
                    selected ? 'card-focused' : ''
                )}
            >
                <Toolbar {...tools} className={cx(
                    'card-toolbar',
                    selected ? 'card-toolbar-focused': ''
                )} />
                <ResizableBox width={Infinity} height={height} handle={handle} onResizeStop={onResizeStop}
                    handleSize={[20, 8]} draggableOpts={{enableUserSelectHack:false}}
                    minConstraints={[100, 100]} maxConstraints={[Infinity, Infinity]}
                >
                    {children}
                </ResizableBox>
            </div>            
            {texts}
        </div>
    );
}