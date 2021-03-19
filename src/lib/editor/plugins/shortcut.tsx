import { Editor, Transforms, Range } from 'slate'
import XMarkPlugin from '../xmark-plugin'
import XMarkHelper, { ElementType } from '../helpers/xmark-helper'
import { ReactEditor } from 'slate-react'

const SHORTCUTS: any = {
    '>': { type: ElementType.BlockQuote},
    '#': { type: ElementType.Heading1},
    '##': { type: ElementType.Heading2},
    '###': { type: ElementType.Heading3},
    '####': { type: ElementType.Heading4},
    '#####': { type: ElementType.Heading5},
    '######': { type: ElementType.Heading6},
    '#1': { type: ElementType.Heading1},
    '#2': { type: ElementType.Heading2},
    '#3': { type: ElementType.Heading3},
    '#4': { type: ElementType.Heading4},
    '#5': { type: ElementType.Heading5},
    '#6': { type: ElementType.Heading6},
    '---': { type: ElementType.HLine, newLine: true},
    '*': {type: ElementType.ListItem, wrap: ElementType.NumberedList},
    '-': {type: ElementType.ListItem, wrap: ElementType.BulletedList},
    '+': {type: ElementType.ListItem, wrap: ElementType.TaskList},
    '```': { type: ElementType.Code, node: {lang: 'Java'} },
}

export const ShortcutPlugin: XMarkPlugin = {
    install: (editor: ReactEditor) => {
        const { insertText } = editor

        editor.insertText = text => {
            const { selection } = editor

            if (text !== ' ' && text !== '\t' ) {
                insertText(text)
                return;
            }

            if (selection && Range.isCollapsed(selection)) {
                const { anchor } = selection
                const block = Editor.above(editor, {
                    match: n => Editor.isBlock(editor, n),
                })
                const path = block ? block[1] : []
                const start = Editor.start(editor, path)
                const range = { anchor, focus: start }
                const beforeText = Editor.string(editor, range)

                //处理快捷输入的转换
                if (text === ' ' ) {
                    const shortcut = SHORTCUTS[beforeText]
            
                    if (shortcut) {
                        Transforms.select(editor, range)
                        Transforms.delete(editor)
                        XMarkHelper.toggleBlock(editor, shortcut.type, shortcut.node);
                        
                        if (shortcut.newLine === true) {
                            Transforms.insertNodes(editor, { type: ElementType.Paragraph, children: [{ text: ''}] })
                        }
                        
                        if (shortcut.type.startsWith(ElementType.Heading)) {
                            XMarkHelper.updateCatalogNo(editor);
                        }
                        if (shortcut.wrap) {
                            const list = { type: shortcut.wrap, children: [] }
                            Transforms.wrapNodes(editor, list, {
                                match: n => n.type === ElementType.ListItem,
                            })
                        }
                        
                        return
                    }
                }

                //处理章节标题的升降
                if (text === '\t') {
                    if (beforeText === '' && block && block[0].type.startsWith(ElementType.Heading) ) {
                        const MAX_LEVEL = 6;

                        let level = XMarkHelper.getHeadingLevel(block[0].type)
                        if (window.event && (window.event as KeyboardEvent).shiftKey) {
                            if (level > 1) {
                                let type = XMarkHelper.getHeadingType(level - 1);
                                XMarkHelper.toggleBlock(editor, type);
                            }
                        }
                        else {
                            if (level < MAX_LEVEL) {
                                let type = XMarkHelper.getHeadingType(level + 1);
                                XMarkHelper.toggleBlock(editor, type);
                            }
                        }
                        
                        return;                        
                    }
                }
            }

            insertText(text)
        }
        
        return editor;
    }
}