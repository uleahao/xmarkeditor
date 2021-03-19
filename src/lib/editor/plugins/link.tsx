import { Editor, Element, Transforms, Range } from 'slate'
import React, { useState, useCallback, useEffect } from 'react';
import { ReactEditor, useSlate } from 'slate-react'
import XMarkPlugin, { ToolbarGroup } from '../xmark-plugin'
import { ToolButton, ToolIcon } from '../elements/toolbar'
import Utils from '../../utils/utils'
import XMarkHelper, { ElementType } from '../helpers/xmark-helper'
import { Modal, Input, Form } from 'antd';

const insertLink = (editor: Editor, url: string) => {
    if (editor.selection) {
        wrapLink(editor, url)
    }
}

const isLinkActive = (editor: Editor) => {
    const [link] = Editor.nodes(editor, { match: n => n.type === ElementType.Link })
    return !!link
}

const unwrapLink = (editor: Editor) => {
    Transforms.unwrapNodes(editor, { match: n => n.type === ElementType.Link })
}

const wrapLink = (editor: Editor, url: string) => {
    if (isLinkActive(editor)) {
        unwrapLink(editor)
    }

    const { selection } = editor
    const isCollapsed = selection && Range.isCollapsed(selection)
    const link = {
        type: ElementType.Link,
        url,
        children: isCollapsed ? [{ text: url }] : [],
    }

    if (isCollapsed) {
        Transforms.insertNodes(editor, link)
    } else {
        Transforms.wrapNodes(editor, link, { split: true })
        Transforms.collapse(editor, { edge: 'end' })
    }
}

const WrapLinkForm = ((props: any) => {
        const { visible, initUrl, onCancel } = props;
        const [ form ] = Form.useForm();

        const onOk = () => {
            let value = form.getFieldValue('link')
            if (value) {
                form.resetFields()
                props.onOk(value)
            }
        }
        useEffect(() => {
            form.setFieldsValue({
                link: initUrl
            })
        }, [form, initUrl])

        return (
          <Modal
                visible={visible}
                title="超链接"
                okText="确定"
                cancelText={'取消'}
                onCancel={onCancel}
                onOk={onOk}
          >
            <Form layout="vertical" form={form}>
                <Form.Item label="超链接" name="link">
                    <Input autoFocus />
                </Form.Item>
            </Form>
          </Modal>
        );
    }
);

export const LinkButton = (props: any) => {
    const editor = useSlate()
    const [ showModal, setShowModal ] = useState(false);
    const [ initUrl, setInitUrl ] = useState<string>();
    const [ selection, setSelection ] = useState<Range | null>(null);

    const openModal = useCallback(() => {
        let url = '';
        let nodes = Editor.nodes(editor, { match: n => n.type === ElementType.Link })
        for (const [node, ] of nodes) {
            url = node.url;
            break;
        }
        setSelection(editor.selection)
        setInitUrl(url);
        setShowModal(true)
    }, [editor])

    const onOK = (url: string) => {
        editor.selection = selection;
        if (url && url.trim().length > 0) {
            insertLink(editor, url);
        }
        else {
            unwrapLink(editor)
        }
        
        setShowModal(false)
    }
    const onCancel = () => {
        setShowModal(false)
    }

    return (
        <div>
            <ToolButton
                onMouseDown={(event: MouseEvent) => {
                    event.preventDefault()
                    openModal();
                }}
                tooltip={props.tooltip}
            >
                <ToolIcon className={props.icon}></ToolIcon>
            </ToolButton>
            <WrapLinkForm visible={showModal} initUrl={initUrl}
                onOk={onOK}
                onCancel={onCancel}
            />
        </div>
    )
}

const tools: ToolbarGroup[] = [
    {
        name : 'others',
        buttons : [
            {
                button : 'link-button',
                type : 'hyper-link',
                icon : 'icon-hyper-link',
                tooltip: '超链接'
            },            
        ]
    }
]
export const LinkPlugin: XMarkPlugin = {
    install: (editor: ReactEditor) => {
        const { insertData, insertText, isInline, normalizeNode } = editor

        editor.isInline = element => {
            return element.type === ElementType.Link ? true : isInline(element)
        }

        editor.insertText = text => {
            if (text && Utils.isUrl(text)) {
                wrapLink(editor, text)
            } else {
                insertText(text)
            }
        }

        editor.insertData = data => {
            const text = data.getData('text/plain')

            if (text && Utils.isUrl(text)) {
                wrapLink(editor, text)
            } else {
                insertData(data)
            }
        }

        editor.normalizeNode = entry => {
            const [node, path] = entry
        
            if (Element.isElement(node) && node.type === ElementType.Link) {
                if (XMarkHelper.getText(node).length === 0) {
                    Transforms.removeNodes(editor, { at: path, match: n => n.type === ElementType.Link })
                    Transforms.select(editor, path);
                    return
                }
            }
        
            normalizeNode(entry)
        }
        
        return editor;
    },
    renderElement: (props) => {
        const { attributes, children, element } = props

        if (element.type === ElementType.Link) {
            return (
                <a {...attributes} href={element.url}>
                  {children}
                </a>
              )
        }
        return undefined;
    },
    renderToolButton: (props) => {
        let {button} = props;
        if (button === 'link-button') {
            return <LinkButton {...props} key={button}/>
        }
    },
    tools
}