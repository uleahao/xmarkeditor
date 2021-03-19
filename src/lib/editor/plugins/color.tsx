import { Editor } from 'slate'
import React, { useState, useCallback } from 'react';
import XMarkPlugin, {ToolbarGroup} from '../xmark-plugin'
import { ReactEditor } from 'slate-react'
import { useSlate } from 'slate-react'
import { ToolIcon } from '../elements/toolbar'
import { SketchPicker } from 'react-color'
import { CaretDownOutlined } from '@ant-design/icons'
import { Dropdown } from 'antd';

const ButtonIcon = (
    <CaretDownOutlined />
);

const FontColorButton = (props:any) => {
    const [type] = useState(props.type);
    const [clearColor] = useState(props.color.clear);

    const editor = useSlate()
    const [color, setColor] = useState(props.color.default);

    const onSetColor = useCallback((color: string) => {
        setColor(color);
        if (color !== clearColor) {
            Editor.removeMark(editor, type);
            Editor.addMark(editor, type, color)
        }
        else 
            Editor.removeMark(editor, type);
    }, [clearColor, editor, type])

    const ClickPicker = (
        <SketchPicker
            disableAlpha={true}
            color={color}
            onChangeComplete={color => onSetColor(color.hex)}
            onChange={color => onSetColor(color.hex)}
        />
    );
    return (
        <div onMouseDown={event => event.preventDefault()}>
            <Dropdown.Button className="tool-button-dropdown" 
                onClick={()=>onSetColor(color)}
                getPopupContainer={trigger => trigger.parentNode as HTMLElement}
                overlay={ClickPicker} size="small" icon={ButtonIcon}
            >
                <ToolIcon className={props.icon}></ToolIcon>
                <div className="color-line" style={{backgroundColor:color}}></div>
            </Dropdown.Button>
        </div>
        
    )
}

const tools: ToolbarGroup[] = [
    {
        name : 'colors',
        buttons : [
            {
                button : 'font-color-button',
                type : 'font-color',
                icon : 'icon-font-color',
                tooltip: '字体颜色',
                color: {
                    default: '#f22735',
                    clear: '#000000'
                }
            },
            {
                button : 'font-bgcolor-button',
                type : 'font-bg-color',
                icon : 'icon-back-color',
                tooltip: '背景颜色',
                color: {
                    default: '#f9da36',
                    clear: '#ffffff'
                }
            }
        ]
    }
]

export const ColorPlugin : XMarkPlugin = {
    install: (editor: ReactEditor) => {
        
        return editor;
    },
    
    renderLeaf: (props, style) => {
        let { children, leaf } = props;
        if (leaf['font-color']) {
            style.color = leaf['font-color'];
        }
        if (leaf['font-bg-color']) {
            style.backgroundColor = leaf['font-bg-color'];
        }                
        return children;
    },

    tools: tools,

    renderToolButton: (props) => {
        let {button} = props;
        switch(button) {
            case 'font-color-button':
            case 'font-bgcolor-button':
                return <FontColorButton {...props} key={button}/>
        }
    }
}
