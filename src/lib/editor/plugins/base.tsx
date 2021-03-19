import { Editor, Element, Node, Text, Transforms, Range, Point } from 'slate'
import React, { useState, useCallback } from "react";
import { ReactEditor, useSlate, useSelected, useFocused } from 'slate-react'
import XMarkPlugin, { ToolbarGroup, ToolMenuProps } from '../xmark-plugin'
import { Dropdown, Menu, Button } from 'antd';
import { CaretDownOutlined } from '@ant-design/icons'
import { Heading } from '../elements/heading'
import XMarkHelper, { ElementType } from '../helpers/xmark-helper'
import { actionButton } from '../elements/toolbar'
import { cx, css } from 'emotion'

const fontsizes = ['9', '10', '11', '12', '14', '16', '18', '22', '24', '30', '36'];

const fontsizeMenus: ToolMenuProps[] = fontsizes.map((size) => {
    return {
        title: size,
        icon: '',
        action: (editor: ReactEditor, data: any) => {
            Editor.addMark(editor, 'font-size', data.title);
            return {
                setTitle: data.title
            }
        }        
    }
})

const alignMenus: ToolMenuProps[] = [
    {
        title: '左对启',
        icon: 'icon-left-align',
        action: (editor, data) => {
            if (XMarkHelper.setBlockAlign(editor, 'left')) {
                return {
                    setIcon: data.icon
                }
            }
        }
    },
    {
        title: '居中',
        icon: 'icon-center-align',
        action: (editor, data) => {
            if (XMarkHelper.setBlockAlign(editor, 'center')) {
                return {
                    setIcon: data.icon
                }
            }
        }
    },
    {
        title: '右对启',
        icon: 'icon-right-align',
        action: (editor, data) => {
            if (XMarkHelper.setBlockAlign(editor, 'right')) {
                return {
                    setIcon: data.icon
                }
            }
        }
    },
    {
        title: '两端对启',
        icon: 'icon-justify-align',
        action: (editor, data) => {
            if (XMarkHelper.setBlockAlign(editor, 'justify')) {
                return {
                    setIcon: data.icon
                }
            }
        }
    }
]
const tools: ToolbarGroup[] = [    
    {
        name : 'text-format',
        buttons : [
            {
                button : 'mark-button',
                type : 'bold',
                icon : 'icon-bold',
                tooltip: '粗体'
            },
            {
                button : 'mark-button',
                type : 'italic',
                icon : 'icon-italic',
                tooltip: '斜体'
            },
            {
                button : 'mark-button',
                type : 'deleteline',
                icon : 'icon-delete-line',
                tooltip: '删除线'
            },
            {
                button : 'mark-button',
                type : 'underline',
                icon : 'icon-underlined',
                tooltip: '下划线'
            },
        ]
    },
    {
        name : 'colors',
        buttons : []
    },
    {
        name : ElementType.Paragraph,
        buttons : [
            {
                button : 'header',
                type : '',
                icon : ''
            },
            {
                button : 'menu-button',
                type : 'font-size',
                icon : '',
                tooltip: '字体大小',
                dropdownMenu: fontsizeMenus,
                minWidth: 10,
                sync: (editor) => {
                    let size = '14';
                    for (const [element, ] of Editor.nodes(editor, {
                        match: (n: Node) => Text.isText(n)
                    })) {
                        if (element['font-size']) {
                            size = element['font-size']
                            break;
                        }
                    }
                    return {
                        setTitle: size
                    }
                },
                enabled: (editor) => {
                    return XMarkHelper.isBlockActive(editor, ElementType.Paragraph);
                }
            },
            {
                button : 'menu-button',
                type : 'block-align',
                icon : 'icon-left-align',
                tooltip: '对启方式',
                dropdownMenu: alignMenus,
                sync: (editor) => {
                    return {
                        setIcon: `icon-${XMarkHelper.getBlockAlign(editor)}-align`
                    }
                }
            },
        ]
    },
    {
        name : 'lists',
        buttons : []
    },
    {
        name : 'others',
        buttons : [
            {
                button : 'block-button',
                type : ElementType.BlockQuote,
                icon : 'icon-quote',
                tooltip: '插入引用'
            },            
            actionButton(ElementType.HLine, '插入分隔线', 
                (editor) => {
                    let path = XMarkHelper.getInsertPath(editor);
                    Transforms.insertNodes(editor, { type: ElementType.HLine, children: [{ text: ''}] }, {at: path})
                }
            ),
            
        ]
    },    
]

const HeaderButton = (props: any) => {
    let { maxDropdownHeight } = props;
    const editor = useSlate()
    const [heading, setHeading] = useState('正文');
    
    const selectedKeys = useCallback(() => {
        const [match] = Editor.nodes(editor, {
            match: n => n.type ? (n.type as string).startsWith(ElementType.Heading) : false,
          }) as Array<any>;

        let keys: string[] = [];
        let headingType: string = '正文'
        keys.push('0')
        if (match) {
            match.forEach((item: any) => {
                if (item.type && (item.type as string).startsWith(ElementType.Heading)) {
                    keys.length = 0;
                    keys.push((item.type as string).substring(ElementType.Heading.length));
                    switch (item.type) {
                        case ElementType.Heading1: 
                            headingType = '标题1'
                            break;
                        case ElementType.Heading2: 
                            headingType = '标题2'
                            break;
                        case ElementType.Heading3: 
                            headingType = '标题3'
                            break;
                        case ElementType.Heading4: 
                            headingType = '标题4'
                            break;
                        case ElementType.Heading5: 
                            headingType = '标题5'
                            break;
                        case ElementType.Heading6: 
                            headingType = '标题6'
                            break;
                    }
                }
            });    
        }

        if (heading !== headingType)
            setHeading(headingType)
        return keys;
    }, [editor, heading])

    const onClick = useCallback((item: any) => {
        if (item.key === '0') {
            XMarkHelper.toggleBlock(editor, ElementType.Paragraph)
        }
        else {
            XMarkHelper.toggleBlock(editor, ElementType.Heading + item.key)
        }
    }, [editor])

    const menu = (
        <Menu selectable selectedKeys={selectedKeys()} onClick={item => onClick(item)}>
          <Menu.Item key="0">正文</Menu.Item>
          <Menu.Item key="1"><h1>标题1</h1></Menu.Item>
          <Menu.Item key="2"><h2>标题2</h2></Menu.Item>
          <Menu.Item key="3"><h3>标题3</h3></Menu.Item>
          <Menu.Item key="4"><h4>标题4</h4></Menu.Item>
          <Menu.Item key="5"><h5>标题5</h5></Menu.Item>
          <Menu.Item key="6"><h6>标题6</h6></Menu.Item>          
        </Menu>
    );
    
    return (        
        <div onMouseDown={event => event.preventDefault()} 
            className="tool-button-dropdown" style={{marginLeft: 7}}
        >
            <Dropdown overlay={menu} overlayClassName={cx(
                maxDropdownHeight > 0 ? 'max-dropdown-height' : '',
                css`${maxDropdownHeight > 0 ? 'max-dropdown-height:' + maxDropdownHeight + 'px': ''}`
              )}
                getPopupContainer={trigger => trigger.parentNode as HTMLElement}
            >
                <Button style={{padding:'0 5px', borderRadius: 4}} size={"small"}>
                    <span style={{width: 25}}>{heading}</span>
                    <CaretDownOutlined />
                </Button>
            </Dropdown>
        </div>
    )
}

const HLine = (props: any) => {
    let {attributes, children} = props;
    const selected = useSelected()
    const focused = useFocused()

    return (
        <div {...attributes} className={cx(
                "h-line",
                selected && focused ? 'focused' : ''
            )}>
            {children}
            <hr/>
        </div>
    )
}

export const BasePlugin : XMarkPlugin = {
    install: (editor: ReactEditor) => {
        const { deleteBackward, normalizeNode, isVoid } = editor

        editor.isVoid = element => {
            return element.type === ElementType.HLine ? true : isVoid(element)
        }
        
        editor.deleteBackward = (...args) => {
            const { selection } = editor

            if (selection && Range.isCollapsed(selection)) {
                const match = Editor.above(editor, {
                    match: n => Editor.isBlock(editor, n),
                })

                if (match) {
                    const [block, path] = match
                    const start = Editor.start(editor, path)

                    if (
                        block.type !== ElementType.Paragraph &&
                        Point.equals(selection.anchor, start)
                    ) {
                        if (block.type !== ElementType.TableCell) {
                            Transforms.setNodes(editor, { type: ElementType.Paragraph })
                        }
                        
                        if (block.type.startsWith(ElementType.Heading)) {
                            XMarkHelper.updateCatalogNo(editor);
                        }

                        return
                    }
                }
            }

            deleteBackward(...args)
        }

        editor.normalizeNode = entry => {
            const [node, path] = entry
        
            // If the element is a paragraph, ensure it's children are valid.
            if (Element.isElement(node) && node.type === ElementType.Paragraph) {
              for (const [child, childPath] of Node.children(editor, path)) {
                if (Element.isElement(child) && !editor.isInline(child)) {
                  Transforms.unwrapNodes(editor, { at: childPath })
                  return
                }                
              }
            }
        
            // Fall back to the original `normalizeNode` to enforce other constraints.
            normalizeNode(entry)
          }
        
        return editor;
    },
    
    renderElement: (props) => {
        let { attributes, children, element } = props;
        let style = XMarkHelper.getElementStyle(element);

        switch (element.type) {
            case ElementType.BlockQuote:
                return <blockquote {...attributes} style={style}>{children}</blockquote>
            case ElementType.HLine:
                return <HLine {...props} />
            case ElementType.Heading1:
                return <Heading {...props} />
            case ElementType.Heading2:
                return <Heading {...props} />
            case ElementType.Heading3:
                return <Heading {...props} />
            case ElementType.Heading4:
                return <Heading {...props} />
            case ElementType.Heading5:
                return <Heading {...props} />
            case ElementType.Heading6:
                return <Heading {...props} />
        }
        return undefined;
    },

    renderLeaf: ({ attributes, children, leaf }, style) => {
        if (leaf.bold) {
            style.fontWeight = 700;
        }
    
        if (leaf.code) {
            children = <code>{children}</code>
        }
    
        if (leaf.italic) {
            style.fontStyle = 'italic';
        }

        if (leaf['font-size']) {
            style.fontSize = leaf['font-size'] + 'px';
        }

        if (leaf.deleteline) {
            style.textDecoration = 'line-through';
        }
        else if (leaf.underline) {
            style.textDecoration = 'underline';
        }

        return children;
    },

    tools: tools,

    renderToolButton: (props) => {
        let {button} = props;
        switch(button) {
            case 'header':
                return <HeaderButton {...props} key={button}/>
        }
    },

    catalogNo: {
        'default': {
            title: '数字编号',
            generate: (parentNo, index): string => {
                if (parentNo && parentNo.trim().length > 0)
                    return `${parentNo}${index + 1}.`;
                else 
                    return `${index + 1}.`;
            }
        }
    }
}

