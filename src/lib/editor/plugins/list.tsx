import { Editor, Element, Node, Transforms, Range, Point } from 'slate'
import React, { useMemo } from "react";
import { ReactEditor, useEditor, useReadOnly } from 'slate-react'
import XMarkPlugin, { ToolbarGroup } from '../xmark-plugin'
import XMarkHelper, { ElementType } from '../helpers/xmark-helper'
import { Checkbox } from 'antd';

const tools: ToolbarGroup[] = [
    {
        name : 'lists',
        buttons : [
            {
                button : 'block-button',
                type : ElementType.NumberedList,
                icon : 'icon-order-list',
                tooltip: '有序列表'
            },
            {
                button : 'block-button',
                type : ElementType.BulletedList,
                icon : 'icon-list',
                tooltip: '无序列表'
            },
            {
                button : 'block-button',
                type : ElementType.TaskList,
                icon : 'icon-task-list',
                tooltip: '任务列表'
            },
        ]
    }
]
export const ListPlugin: XMarkPlugin = {
    install: (editor: ReactEditor) => {
        const { insertBreak, deleteBackward, normalizeNode } = editor

        editor.insertBreak = (...args) => {
            const { selection } = editor

            if (selection && Range.isCollapsed(selection)) {                
                const match = Editor.above(editor, {
                    match: n => n.type === ElementType.ListItem,
                })
                const above = Editor.above(editor, {
                    match: n => Editor.isBlock(editor, n),
                })

                if (match && above) {
                    const parent = Editor.above(editor, {at: match[1]});

                    //如果输入换行时按下了shiftKey，则内容换行，不插入新的列表项
                    if (above[0].type === ElementType.ListItem && editor.keyEvent && editor.keyEvent.shiftKey) {
                        Transforms.wrapNodes(editor, { type: ElementType.Paragraph, children: []}, {at: [...match[1], 0]})
                    }
                    //否则如果在列表项中的段落中输入换行符，则插入新的列表项
                    else if (above[0].type === ElementType.Paragraph) {
                        insertBreak(...args)
                        Transforms.liftNodes(editor);
                        return;
                    }
                    //如果是最后一个列表项，并且最后一个列表项无字符，则插入与UL同级的新段落
                    else if (parent && parent[0].children[parent[0].children.length - 1] === match[0] && XMarkHelper.getText(match[0]) === '') {
                        insertBreak(...args)
                        Transforms.liftNodes(editor);
                        Transforms.setNodes(editor, { type: ElementType.Paragraph })
                        return;
                    }
                }
            }

            insertBreak(...args)
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
                        block.type === ElementType.ListItem &&
                        Point.equals(selection.anchor, start)
                    ) {
                        let [ancestor] = Editor.parent(editor, path)

                        if (XMarkHelper.isList(ancestor.type) && ancestor.children.length === 1) {
                            Transforms.unwrapNodes(editor, {
                                match: n => n.type === ancestor.type,
                            })
                            Transforms.setNodes(editor, { type: ElementType.Paragraph })
                        }
                        else if (ancestor.children[0] === block) {
                            Transforms.liftNodes(editor);
                            Transforms.setNodes(editor, { type: ElementType.Paragraph })
                        }
                        else {
                            Transforms.mergeNodes(editor);
                        }
                        return;
                    }
                }
            }

            deleteBackward(...args)
        }
        editor.normalizeNode = entry => {
            const [node, path] = entry
        
            if (Element.isElement(node) && node.type === ElementType.ListItem) {
                let [ancestor] = Editor.parent(editor, path)
                if (ancestor.type === ElementType.TaskList) {
                    Transforms.setNodes(editor, { listStyle: 'checkbox' }, {at: path})
                }
                else if (ancestor.type === ElementType.NumberedList || ancestor.type === ElementType.BulletedList) {
                    Transforms.setNodes(editor, { listStyle: '' }, {at: path})
                }
                else if (ancestor.type === ElementType.ListItem) {
                    Transforms.unwrapNodes(editor, {at: path});
                }
                else {
                    let parent = {
                        type: node.listStyle === 'checkbox' ? ElementType.TaskList : ElementType.BulletedList, 
                        children: []
                    }
                    Transforms.wrapNodes(editor, parent, {
                        at: path
                    });
                }
            }
            if (Element.isElement(node) && XMarkHelper.isList(node.type)) {
                for (const [child, childPath] of Node.children(editor, path)) {
                    if (Element.isElement(child)) {
                        if (XMarkHelper.isList(child.type)) {
                            Transforms.unwrapNodes(editor, { at: path })
                            return
                        }
                        else if (child.type !== ElementType.ListItem) {
                            Transforms.setNodes(editor, { type: ElementType.ListItem }, { at: childPath })
                            return
                        }
                        else if (node.type === 'task-list' && child.listStyle !== 'checkbox') {
                            Transforms.setNodes(editor, { listStyle: 'checkbox' }, { at: childPath })
                            return
                        }
                        else if (node.type !== 'task-list' && child.listStyle === 'checkbox'){
                            Transforms.setNodes(editor, { listStyle: '' }, { at: childPath })
                            return
                        }
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
            case ElementType.BulletedList:
                return <ul {...attributes} style={style}>{children}</ul>
            case ElementType.NumberedList:
                return <ol {...attributes} style={style}>{children}</ol>
            case ElementType.TaskList:
                return <ul {...attributes} style={style} className={'task-list'}>{children}</ul>
            case ElementType.ListItem:
                return <ListItem {...props} />
        }
        return undefined;
    },

    tools
}

const ListItem = (props: any) => {
    const { attributes, children, element } = props;
    const editor = useEditor()
    const readOnly = useReadOnly()
    const { listStyle, checked } = element

    const style = useMemo(() => {
        return XMarkHelper.getElementStyle(element);
    }, [element])

    const onChange = (event: any) => {
        const path = ReactEditor.findPath(editor, element)
        Transforms.setNodes(
            editor,
            { checked: event.target.checked },
            { at: path }
        )
    }
    if (listStyle === 'checkbox') {
        return (
            <li {...attributes} style={style} className={'task-list-item'}>
                <span contentEditable={false} className={'check-wrapper'}>
                    <Checkbox onChange={onChange} disabled={readOnly} checked={checked} />
                </span>
                {children}
            </li>
        )
    }
    return <li {...attributes} style={style}>{children}</li>
}