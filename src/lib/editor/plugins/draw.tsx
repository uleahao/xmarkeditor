import { Editor, Transforms } from 'slate'
import React, { useCallback, useState, useRef, useEffect } from 'react';
import { ReactEditor, useEditor, useReadOnly, useSelected } from 'slate-react'
import Viewer from 'react-viewer';
import XMarkPlugin, { EditorProps } from '../xmark-plugin'
import { ElementType } from '../helpers/xmark-helper'
import { ToolbarProps, actionButton } from '../elements/toolbar'
import { Card } from '../elements/card'
import DiagramEditor from '../helpers/drawio-editor'

export const DrawPlugin: XMarkPlugin = {
    install: (editor: ReactEditor) => {
        const { isVoid } = editor

        editor.isVoid = element => {
            return element.type === ElementType.Draw ? true : isVoid(element)
        }
        
        return editor;
    },
    renderElement: (props) => {
        const { element } = props
        switch (element.type) {
            case ElementType.Draw:
                return <DrawCard {...props} />
        }
        return undefined;
    },
    
    insertMenu: [
        {
            title: '绘图',
            icon: 'icon-draw',
            action: (editor) => insertDraw(editor)
        }
    ]
}

const insertDraw = (editor: Editor) => {
    const INIT_DATA = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAADcHRFWHRteGZpbGUAJTNDbXhmaWxlJTIwbW9kaWZpZWQlM0QlMjIyMDE5LTA4LTI4VDAwJTNBMzElM0ExOS41NzRaJTIyJTIwaG9zdCUzRCUyMnd3dy5kcmF3LmlvJTIyJTIwYWdlbnQlM0QlMjJNb3ppbGxhJTJGNS4wJTIwKFdpbmRvd3MlMjBOVCUyMDEwLjAlM0IlMjBXaW42NCUzQiUyMHg2NCklMjBBcHBsZVdlYktpdCUyRjUzNy4zNiUyMChLSFRNTCUyQyUyMGxpa2UlMjBHZWNrbyklMjBDaHJvbWUlMkY3Ni4wLjM4MDkuMTMyJTIwU2FmYXJpJTJGNTM3LjM2JTIyJTIwdmVyc2lvbiUzRCUyMjExLjIuMyUyMiUyMGV0YWclM0QlMjJFZ2MxQjFQSU1fN1MzdWJtX2l5ZSUyMiUyMHBhZ2VzJTNEJTIyMSUyMiUzRSUzQ2RpYWdyYW0lMjBpZCUzRCUyMlZHR3E1MXl6UWYwU2lXanRyZEZyJTIyJTIwbmFtZSUzRCUyMiVFNyVBQyVBQyUyMDElMjAlRTklQTElQjUlMjIlM0VyWlROYm9RZ0ZJV2Z4ajAlMkZIY2ZaMWs3YnpXUVdrNlpyUnFqUW9CaWswZmJwaTZJaTBYUnNNaHNESDRmanZSY3VFVTZMOWtXVGlwOFVaVEpDZ0xZUmZvb1Eyc1BFZmp2dzdRQ0UlMkJPQklyZ1YxREhod0VUOXNFSTcwUzFCV0Q4d2hvNVEwb2dwaHBzcVNaU1pnUkd2VmhMSVBKV2tBS3BLekJiaGtSQzdwdTZDR081cWcyUE5YSm5JJTJCJTJGaG5HUTM0RkdjVkRKalVuVkRVemhJOFJUclZTeG8zZWFxYlAxODh1Q1FRa3VkcEM5dG9obDFKWVI2RktCeHNpT2hrRTFzbUdnbTI1OEdQTnJUOENDUGFaRXNyVzF1Qnl6WnVCbTNUMFFYaXpGSzVJZCUyQnZLaCUyRnNFQiUyQk0xdVB1akt2dnQzc25XR0tjZGg2MzVvM3NkemolMkJrYUx2MDF1bDAxeTVvNnY1ZUYyM0twSDBVbnQzVURtWTNQVkJNbTZlbTA2dzA4eWJ5SHI1djdDUjRmZkR4RnclM0QlM0QlM0MlMkZkaWFncmFtJTNFJTNDJTJGbXhmaWxlJTNFjW5viAAAAAtJREFUGFdjYAACAAAFAAGq1chRAAAAAElFTkSuQmCC';
    
    const draw = { type: ElementType.Draw, data: INIT_DATA, children: [{ text: ''}] }
    Transforms.insertNodes(editor, draw)
    let selection = editor.selection;
    Transforms.insertNodes(editor, { type: ElementType.Paragraph, children: [{ text: ''}]})
    editor.selection = selection;
}

export const DrawOption = {
    /**
     * 部署drawio的服务器地址
     */
    server: 'draw.server',
}

const DrawCard = (props: any) => {
    let {attributes, children, element} = props;
    const editor = useEditor()
    const readOnly = useReadOnly()
    const selected = useSelected()
    const [ viewerVisible, setViewerVisible ] = useState(false);
    const [ placeholderVisible, setPlaceholderVisible ] = useState(false);
    const imgRef = useRef(null);
    const editorProps: EditorProps = editor.editorProps;
    const drawDomain = editorProps?.option?.[DrawOption.server] || 'https://www.draw.io/';

    let height = element.height ? element.height : 200;
    
    const editImage = useCallback(() => {
        if (readOnly) {
            return;
        }

        DiagramEditor.editElement(imgRef.current, {
            className: 'drawio-frame',
            ui: 'kennedy',
            drawDomain: drawDomain,
            done: (data: any) => {
                let path = ReactEditor.findPath(editor, element);
                Transforms.setNodes(editor, { data: data }, { at: path });
            }
        })
        return;        
    }, [drawDomain, editor, element, readOnly])

    useEffect(() => {
        if ((imgRef.current as unknown as HTMLElement).offsetHeight > 10) {
            setPlaceholderVisible(false)
        }
        else {
            setPlaceholderVisible(true)
        }
        
    }, [imgRef, element])

    const tools: ToolbarProps = {
        groups: [
            {
                name: 'hover-tools',
                buttons: [
                    actionButton('draw-edit', '编辑', () => {
                        editImage()
                    }),
                    actionButton('fit-height', '自动调整高度', () => {
                        let img: HTMLImageElement = imgRef.current as unknown as HTMLImageElement;
                        let path = ReactEditor.findPath(editor, element);
                        Transforms.setNodes(editor, {height: img.parentElement?.scrollHeight}, {at: path});
                    }),
                    actionButton('search', '放大', () => {
                        setViewerVisible(true);
                    }),
                    actionButton('delete', '删除', () => {
                        let path = ReactEditor.findPath(editor, element);
                        Transforms.removeNodes(editor, {at: path});
                    }),
                ]
            }
        ]
    }

    const onResizeStop = useCallback((size: {width: number, height: number}) => {
        let path = ReactEditor.findPath(editor, element);
        Transforms.setNodes(editor, {height: size.height}, {at: path});
    }, [editor, element]);
    
    const inner = (
        <div className="draw-container" contentEditable={false} onDoubleClick={editImage}>
            <img ref={imgRef} className="drawio" style={{cursor: 'default'}} alt={''} src={element.data} />
            { placeholderVisible &&
              <span className="placeholder">双击开始绘图</span>
            }
            <Viewer
                visible={viewerVisible} noNavbar={true} 
                onClose={() => { setViewerVisible(false); } }
                images={[{src: element.data, alt: ''}]}
            />
        </div>
    )
    if (readOnly) {
        return (
            <div {...attributes}>
                {inner}
            </div>
        );
    }
    return (
        <div {...attributes}>
            <Card tools={tools} texts={children} selected={selected}
                onResizeStop={onResizeStop} height={height}
            >
                {inner}
            </Card>
        </div>
   )
}