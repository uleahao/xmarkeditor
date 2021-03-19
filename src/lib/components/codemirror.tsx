import React, { useState, useEffect, useRef } from 'react';
import cm from 'codemirror'
import 'codemirror/addon/edit/matchbrackets'
import 'codemirror/addon/edit/closebrackets'
import 'codemirror/mode/javascript/javascript'
import 'codemirror/mode/clike/clike'
import 'codemirror/mode/php/php'
import 'codemirror/mode/python/python'

export const modes: any = {
    'C': 'text/x-c',
    'C++': 'text/x-c++src',
    'C#': 'text/x-csharp',
    'JSON': 'application/json',
    'JavaScript': 'javascript',
    'Java': 'text/x-java',
    'Kotlin': 'text/x-kotlin',
    'Object C': 'text/x-objectivec',
    'PHP': 'text/x-php',
    'Python': 'text/x-python',
    'Scala': 'text/x-scala',
    'TypeScript': 'text/typescript',
}
type Props = {
    value: string, 
    options: cm.EditorConfiguration,
    onChange: (value: string) => void;
}
export const CodeMirror = (props: Props) => {
    const { value, options } = props;
    const ref = useRef(null);
    const [ editor, setEditor ]: [cm.Editor | undefined, any] = useState();

    useEffect(() => {
        if (value) {
            options.value = value;
        }
        let editor = cm(ref.current as unknown as HTMLElement, options);
        setEditor(editor);
        editor.on('change', () => {
            if (props.onChange) {
                props.onChange(editor.getValue());
            }
        })
    }, [ref])

    useEffect(() => {
        editor?.setOption('mode', options.mode);
    }, [editor, options])

    return (
        <div className='codemirror'>
            <div
                ref={ref}
            />
        </div>
    );
}