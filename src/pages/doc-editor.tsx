import React, {useEffect, useState} from 'react';
import XMarkEditor from '../lib/editor/xmark-editor'
import {ElementType} from '../lib/editor/helpers/xmark-helper'
import { ImageOption } from '../lib/editor/plugins/image'
import { DrawOption } from '../lib/editor/plugins/draw'

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

let defaultOption: any = {}
defaultOption[ImageOption.MaxFileSize] = 5242880;
defaultOption[DrawOption.server] = 'https://www.draw.io/'

const DocEditor = (props: any) => {
    const onSave = (value: any) => {
        return new Promise<any>((resolve, reject) => {
            reject('服务未装载，保存失败。')
        })
    }

    const [editorValue, setEditorValue] = useState(initialValue)
    const [option, setOption] = useState(defaultOption)
    const [save, setSave] = useState<(value: any)=>Promise<any>>(onSave)

    useEffect(() => {
        (window as any).init = (config: any) => {
            if (config.option) {
                setOption({...config.option, ...option})
            }
            if (config.value) {
                setEditorValue(config.value)
            }
            if (config.save) {
                setSave(config.save)
            }
        }
        return () => {
            delete (window as any).init
        };
    });

    return (
        <div className="App">
            <XMarkEditor onSave={save} option={option} value={editorValue}/>
        </div>
    )
}

export default DocEditor;