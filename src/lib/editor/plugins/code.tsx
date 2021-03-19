import { Editor, Transforms, Range, Path } from 'slate'
import React, { useState, useCallback, useEffect } from 'react';
import { ReactEditor, useEditor, useReadOnly } from 'slate-react'
import XMarkHelper, { ElementType } from '../helpers/xmark-helper'
import XMarkPlugin from '../xmark-plugin'
import { Toolbar, ToolbarProps, actionButton } from '../elements/toolbar'
import { cx } from 'emotion'
import { CodeMirror, modes } from '../../components/codemirror'
import { Dropdown, Menu, Button } from 'antd';
import { CaretDownOutlined } from '@ant-design/icons'


export const CodePlugin: XMarkPlugin = {
    install: (editor: ReactEditor) => {
        const { isVoid } = editor

        editor.isVoid = element => {
            return element.type === ElementType.Code ? true : isVoid(element)
        }
        
        return editor;
    },
    renderElement: (props) => {
        const { element } = props
        switch (element.type) {
            case ElementType.Code:
                return <CodeBlock {...props} />
        }
        return undefined;
    },    
    insertMenu: [
        {
            title: '代码块',
            icon: 'icon-code',
            action: (editor) => insertCodeBlock(editor)
        }
    ]
}

const insertCodeBlock = (editor: Editor) => {
    
    const code = { type: ElementType.Code, data: '', lang: 'Java', children: [{ text: ''}] }

    let path = XMarkHelper.getInsertPath(editor);
    Transforms.insertNodes(editor, code, {at: path});
}

const CodeBlock = (props: any) => {
    let {attributes, children, element} = props;
    const editor = useEditor()
    const readOnly = useReadOnly()
    const [ selected, setSelected ] = useState(false)
    const [ mode, setMode ] = useState(modes[element.lang || 'Java'])

    const setFocus = useCallback(() => {
        let path = ReactEditor.findPath(editor, element);
        let selection: Range = {
            anchor: {
                path,
                offset: 0
            },
            focus: {
                path,
                offset: 0
            }
        }
        editor.selection = selection;
        setSelected(true);
    }, [editor, element]);

    useEffect(() => {
        const id = setInterval(() => {
            const { selection } = editor;
            let selected = false;
            if (selection) {
                let path = ReactEditor.findPath(editor, element);
                selected = Range.includes(selection as Range, path);
            }
            setSelected(selected);    
            if (selected === false) {
                clearInterval(id);
            }
        }, 500)
        return () => {
            clearInterval(id);
        }
    }, [editor, element, selected])

    const onChange = (value: string) => {
        let path = ReactEditor.findPath(editor, element);
        Transforms.setNodes(editor, { data: value }, { at: path })   
    }

    const tools: ToolbarProps = {
        groups: [
            {
                name: 'footer-tools',
                buttons: [
                    actionButton('delete', '删除', () => {
                        let path = ReactEditor.findPath(editor, element);
                        Transforms.removeNodes(editor, {at: path});
                    }),
                    actionButton('append-line', '在后方插入行', () => {
                        let path = ReactEditor.findPath(editor, element);
                        path = Path.next(path);
                        Transforms.insertNodes(editor, { type: ElementType.Paragraph, children: [{ text: ''}]}, {at: path})                        
                    }),
                    {
                        button : 'code-select',
                        type : element.lang,
                        icon : ''
                    },
                ]
            }
        ]
    }
    const onCodeTypeChange = (codeType: string) => {
        let mode = modes[codeType];
        if (mode) {
            setMode(mode);
            const path = ReactEditor.findPath(editor, element)
            Transforms.setNodes(
                editor,
                { lang: codeType },
                { at: path }
            )
        }
    }
    const renderToolButton = (props: any) => {
        let {button} = props;
        switch(button) {
            case 'code-select':
                return <CodeTypeSelect {...props} onChange={onCodeTypeChange} key={button} maxDropdownHeight={200}/>
        }
    }

    return (
        <div {...attributes} onFocusCapture={event => {
                event.preventDefault();
                event.stopPropagation();
            }}
            onClick={setFocus}
        >
            <div contentEditable={false} className="controller">
                <CodeMirror 
                    onChange={onChange}
                    value={element.data}
                    options={{
                        autofocus: true,
                        inputStyle: 'contenteditable',
                        lineNumbers: true,
                        readOnly: false,
                        matchBrackets: true,
                        autoCloseBrackets: true,
                        mode,
                    }} 
                />
                <div className="code-footer">
                    {
                        !readOnly && selected ?
                        <Toolbar {...tools} className={cx(
                                'code-toolbar',
                                'card-toolbar',
                            )} 
                            renderToolButton={renderToolButton}
                        />
                        :
                        <div className="code-lang">
                            {element.lang}
                        </div>
                    }
                    
                </div>
            </div>
            {children}            
        </div>
    )
}


const CodeTypeSelect = (props: any) => {
    let { maxDropdownHeight } = props;
    const [codeType, setCodeStype] = useState(props.type);
    
    const onChange = (codeType: string) => {
        setCodeStype(codeType);
        if (props.onChange) {
            props.onChange(codeType)
        }
    }
    const menu = (
        <Menu selectable selectedKeys={[codeType]} onClick={item => onChange(item.key)}>
            {
                Object.keys(modes).map((name: string, index: number) => {
                    return <Menu.Item key={name}>{name}</Menu.Item>
                })
            }
        </Menu>
    );
    
    return (        
        <div onMouseDown={event => event.preventDefault()} 
            className="tool-button-dropdown" style={{marginLeft: 7}}
        >
            <Dropdown overlay={menu} overlayClassName={maxDropdownHeight > 0 ? 'max-dropdown-height' : ''}
                overlayStyle={maxDropdownHeight > 0 ? {maxHeight: maxDropdownHeight} : {}}
                getPopupContainer={trigger => trigger.parentNode as HTMLElement}
            >
                <Button style={{padding:'0 5px', borderRadius: 4}} size={"small"}>
                    <span style={{minWidth: 80}}>{codeType}</span>
                    <CaretDownOutlined />
                </Button>
            </Dropdown>
        </div>
    )
}
