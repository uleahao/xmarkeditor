import React, { useState, useCallback, useMemo, useEffect, KeyboardEvent } from 'react'
import { Slate, Editable, RenderElementProps, RenderLeafProps } from 'slate-react'
import XMarkPlugin, { EditorProps, ToolButtonProps } from './xmark-plugin'
import { Toolbar, ToolbarProps } from './elements/toolbar'
import XMarkHelper, {ElementType} from './helpers/xmark-helper'
import { Outline } from './elements/outline'
import XMarkCore from './xmark-core'
import { message } from 'antd'

/**
 * 编辑器属性定义
 */
export interface XMarkEditorProps extends EditorProps {
    //插件
    plugins?: XMarkPlugin[];

    //编辑器初始值
    value?: any;
    
    //保存事件回调
    onSave: (value: any) => Promise<any>;
};

const XMarkEditor = (props: XMarkEditorProps) => {
    let { plugins, value, onSave } = props;
    const [editorValue, setEditorValue] = useState(value)

    const allPlugins = useMemo(() => {
        return XMarkCore.allPlugins(plugins)
    }, [plugins])
    
    const tools: ToolbarProps = useMemo(() => {
        return XMarkCore.tools(allPlugins, () => {
            onSave(editorValue).then(() => {
                message.info('保存成功');
            }).catch((error) => {
                message.error(error);
            })
        })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allPlugins, onSave])

    const renderElement = useCallback((props: RenderElementProps) => {
        return XMarkCore.renderElement(allPlugins, props);
    }, [allPlugins])

    const renderLeaf = useCallback((props: RenderLeafProps) => {
        return XMarkCore.renderLeaf(allPlugins, props);
    }, [allPlugins])

    const renderToolButton = useCallback((props: ToolButtonProps) => {
        return XMarkCore.renderToolButton(allPlugins, props);
    }, [allPlugins])

    const editor = useMemo(() => {
        const editorProps: EditorProps = {
            onUpload: props.onUpload,
            option: props.option
        }
        return XMarkCore.editor(allPlugins, editorProps);
    }, [allPlugins, props])

    const onKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
        if (event.keyCode === 9) {
            event.preventDefault();
            editor.insertText('\t');            
        }
        editor.keyEvent = {
            shiftKey: event.shiftKey,
            ctrlKey: event.ctrlKey,
            altKey: event.altKey
        }
    }, [editor]);

    const onKeyUp = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
        editor.keyEvent = null
    }, [editor]);

    //更新目录编号
    useEffect(() => {
        XMarkHelper.updateCatalogNo(editor);

    }, [editor, editorValue.length])
    
    return (
        <div className={"xmark-editor"}>
            <Slate editor={editor} value={editorValue} onChange={value => setEditorValue(value)}>
                <Toolbar {...tools} renderToolButton={renderToolButton} />
                <div className={"content-wrapper"}>
                    <Outline editorValue={editorValue} />
                    <div className={"content"}>
                        <div className={"content-extra"}>
                            <div className={"title"}>
                                <input className={"title-input"}/>
                            </div>
                        </div>                        
                        <Editable className={"editor-core"}
                            renderElement={renderElement}
                            renderLeaf={renderLeaf}
                            placeholder=""                            
                            autoFocus
                            onKeyDownCapture={onKeyDown}
                            onKeyUpCapture={onKeyUp}
                        />
                    </div>
                    <div className="content-right"></div>
                </div>
            </Slate>
        </div>
    )
}


const initialValue = [
    {
        type: ElementType.Paragraph,
        children: [
            {
                text: '',                
            },
        ],
    }
]

XMarkEditor.defaultProps = {
    value: initialValue
}

export default XMarkEditor