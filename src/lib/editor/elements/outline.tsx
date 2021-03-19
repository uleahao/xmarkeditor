import React, { useMemo, useCallback } from 'react';
import { useEditor, ReactEditor } from 'slate-react'
import { Node } from 'slate'
import XMarkHelper, { Catalog } from '../helpers/xmark-helper'
import { Tree } from 'antd';
const TreeNode = Tree.TreeNode;


export const Outline = (props: any) => {
    const { attributes } = props;
    const editorValue: any[] = props.editorValue;
    const editor = useEditor();

    const tocData: Catalog[] = useMemo(() => {
        return XMarkHelper.getCatalogTree(editorValue)
    }, [editorValue]);

    const onSelect = useCallback((selectedKeys: any[]) => {
        if (selectedKeys.length === 0) {
            return;
        }
        let path = [ parseInt(selectedKeys[0])];
        
        let element = ReactEditor.toDOMNode(editor, Node.get(editor, path));
        if (element) {
            let wrapper = element.closest('.content-wrapper');
            wrapper?.scrollTo({top: element.offsetTop})
        }
    }, [editor]);

    const loop = (data: Catalog[]) => data.map((item) => {
        if (item.children && item.children.length) {
            return (
                <TreeNode key={item.key} title={`${item.catNo} ${item.title}`} expanded={true}>
                    {loop(item.children)}
                </TreeNode>
            )
        }
        return <TreeNode key={item.key} title={`${item.catNo} ${item.title}`}/>;
    });
    return (
        <div {...attributes} className="xmark-outline">
            <div className="outline-header">大纲</div>
            <div className="outline-tree">
                <Tree defaultExpandAll={true} onSelect={onSelect}>
                    {loop(tocData)}
                </Tree>
            </div>
        </div>
    )
}