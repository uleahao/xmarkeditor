import React, {useEffect, useState} from 'react';
import XMarkViewer from '../lib/editor/xmark-viewer'
import {ElementType} from '../lib/editor/helpers/xmark-helper'

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
const DocViewer = (props: any) => {
    const [editorValue, setEditorValue] = useState(initialValue)

    useEffect(() => {
        (window as any).init = (config: any) => {
            if (config.value) {
                setEditorValue(config.value)
            }
        }
        return () => {
            delete (window as any).init
        };
    });

    return (
        <XMarkViewer value={editorValue} />
    )
}

export default DocViewer;