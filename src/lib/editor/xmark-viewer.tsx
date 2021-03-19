import React, { useState, useCallback, useMemo } from 'react'
import { Slate, Editable, RenderElementProps, RenderLeafProps } from 'slate-react'
import {ElementType} from './helpers/xmark-helper'
import XMarkPlugin from './xmark-plugin'
import XMarkCore from './xmark-core'

export type XMarkEditorProps = {
    plugins?: XMarkPlugin[];
    value?: any;
};

const XMarkViewer = (props: XMarkEditorProps) => {
    let { plugins, value } = props;
    const [editorValue, setEditorValue] = useState(value)

    const allPlugins = useMemo(() => {
        return XMarkCore.allPlugins(plugins)
    }, [plugins])
    
    const renderElement = useCallback((props: RenderElementProps) => {
        return XMarkCore.renderElement(allPlugins, props);
    }, [allPlugins])

    const renderLeaf = useCallback((props: RenderLeafProps) => {
        return XMarkCore.renderLeaf(allPlugins, props);
    }, [allPlugins])

    const editor = useMemo(() => {
        return XMarkCore.editor(allPlugins);
    }, [allPlugins])
    
    return (
        <div className={"xmark-viewer"}>
            <Slate editor={editor} value={editorValue} onChange={value => setEditorValue(value)}>
                <Editable className={"editor-core"}
                    renderElement={renderElement}
                    renderLeaf={renderLeaf}
                    placeholder=""
                    readOnly
                />
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

XMarkViewer.defaultProps = {
    value: initialValue
}

export default XMarkViewer