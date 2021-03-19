import React, { CSSProperties } from 'react'
import { withHistory, HistoryEditor } from 'slate-history'
import { createEditor } from 'slate'
import { ReactEditor, withReact, RenderElementProps, RenderLeafProps } from 'slate-react'
import XMarkPlugin, {EditorProps, ToolbarGroup, ToolButtonProps, ToolMenuProps, CatalogNo} from './xmark-plugin'
import { ToolbarProps, ToolButton, actionButton } from './elements/toolbar'
import XMarkHelper from './helpers/xmark-helper'

import { BasePlugin } from './plugins/base'
import { ColorPlugin } from './plugins/color'
import { DrawPlugin } from './plugins/draw'
import { ImagePlugin } from './plugins/image'
import { TablePlugin } from './plugins/table'
import { CodePlugin } from './plugins/code'
import { LinkPlugin } from './plugins/link'
import { ListPlugin } from './plugins/list'
import { ShortcutPlugin } from './plugins/shortcut'

//默认加载的插件
const defaultPlugins = [
    BasePlugin,
    ColorPlugin,
    ListPlugin,
    LinkPlugin,
    ImagePlugin,
    DrawPlugin,
    TablePlugin,
    CodePlugin,
    ShortcutPlugin
]

/**
 * 合并两个工具组，将组名相同的工具合并在同一组中
 * @param tools1 
 * @param tools2 
 */
function mergeTools(tools1 : ToolbarGroup[], tools2 : ToolbarGroup[]):ToolbarGroup[] {
    let tools:ToolbarGroup[] = tools1.slice();
    let map:{[key:string] : ToolbarGroup} = {};

    tools.forEach((item, index) => {
        map[item.name] = item;
    })
    tools2.forEach((item, index) => {
        if (map[item.name]) {
            map[item.name].buttons = map[item.name].buttons.concat(...item.buttons);
        }
        else {
            tools.push(item);
            map[item.name] = item;
        }
    });

    return tools;
}

/**
 * 获取分级目录生成器的键值对，{key: 生成器}
 * @param plugins 所有插件
 */
const catalogNoMap = (plugins: XMarkPlugin[]): {[key: string]: CatalogNo} => {
    let map = {};
    for (let i = 0; i < plugins.length; i++) {
        let plugin = plugins[i];
        if (plugin.catalogNo) {
            map = {...map, ...plugin.catalogNo}
        }
    }
    return map;
}

export default {
    allPlugins: (plugins?: XMarkPlugin[]) => {
        let array = [...defaultPlugins];
        if (plugins)
            array = array.concat(plugins);
        return array;
    },

    catalogNoMap,

    /**
     * 获取工具栏定义
     * @param plugins 所有插件
     * @param onSave 保存事件回调
     * @returns 工具栏定义
     */
    tools: (plugins: XMarkPlugin[], onSave: () => void): ToolbarProps => {
        let tprops: ToolbarProps = {
            className : 'toolbar'
        }
        let groups: ToolbarGroup[] = [{
            name : 'base',
            buttons: [
                actionButton('save', '保存', () => {
                    if (onSave) {
                        onSave()
                    }
                }),
                actionButton('undo', '撤销', (editor) => {
                    const e = editor as ReactEditor & HistoryEditor
                    HistoryEditor.undo(e);
                }),
                actionButton('redo', '重做', (editor) => {
                    const e = editor as ReactEditor & HistoryEditor
                    HistoryEditor.redo(e);
                }),
                // actionButton('format-brush', '格式刷', () => {
    
                // }),
                actionButton('format-clear', '清除格式', (editor) => {
                    XMarkHelper.cleanMarks(editor)
                }),
            ]
        }];
        let menus: ToolMenuProps[] = []
        for (let i = 0; i < plugins.length; i++) {
            let plugin = plugins[i];
            if (plugin.tools) {
                groups = mergeTools(groups, plugin.tools);
            }
            if (plugin.insertMenu) {
                menus = menus.concat(plugin.insertMenu);
            }
        }
        if (menus.length > 0) {
            let systool: ToolbarGroup[] = [{
                name: 'sys',
                buttons: [
                    {
                        button: 'menu-button',
                        name: '插入',
                        type: 'insert_card',
                        icon: 'icon-library-add',
                        dropdownMenu: menus
                    }
                ]
            }];
            groups = mergeTools(systool, groups);
        }

        let funcs: ToolbarGroup[] = [{
            name : 'functions',
            buttons: [
                // actionButton('find', '查找和替换', () => {
                // }),
                // actionButton('outline', '大纲', (editor) => {
                // }),
                // actionButton('preview', '预览', (editor) => {
                // }),
            ]
        }];
        groups = mergeTools(groups, funcs);
        tprops.groups = groups;
        return tprops;
    },

    /**
     * 从所有插件中查找支持本编辑元素渲染的插件，并渲染编辑元素，否则默认渲染为<p></p>
     * @param plugins 所有插件
     * @param elProps 编辑元素属性
     * @returns 渲染结果
     */
    renderElement: (plugins: XMarkPlugin[], elProps: RenderElementProps): JSX.Element => {
        let style = XMarkHelper.getElementStyle(elProps.element);
        
        for (let i = 0; i < plugins.length; i++) {
            let plugin = plugins[i];
            if (plugin.renderElement) {
                let element = plugin.renderElement(elProps);                
                if (element)
                    return element;
            }
        }

        return <p {...elProps.attributes} style={style}>{elProps.children}</p>;
    },

    /**
     * 从所有插件中查找支持本编辑文本渲染的插件，并渲染编辑文本，否则默认渲染为<span></span>
     * @param plugins 所有插件
     * @param props 编辑文本属性
     * @returns 渲染结果
     */
    renderLeaf: (plugins: XMarkPlugin[], props: RenderLeafProps): JSX.Element => {
        let style: CSSProperties = {}

        for (let i = 0; i < plugins.length; i++) {
            let plugin = plugins[i];
            if (plugin.renderLeaf) {
                let children = plugin.renderLeaf(props, style);
                if (children)
                    props.children = children;
            }
        }
        let { attributes, children } = props;
        
        return <span {...attributes} style={style}>{children}</span>
    },

    /**
     * 从所有插件中查找支持本工具栏按钮渲染的插件，并渲染工具栏按钮，否则默认渲染为<ToolButton></ToolButton>
     * @param plugins 所有插件
     * @param tprops 工具按钮属性
     * @returns 渲染结果
     */
    renderToolButton: (plugins: XMarkPlugin[], tprops: ToolButtonProps): JSX.Element => {
        for (let i = 0; i < plugins.length; i++) {
            let plugin = plugins[i];
            if (plugin.renderToolButton) {
                let button = plugin.renderToolButton(tprops);
                if (button)
                    return button;
            }
        }
        return <ToolButton {...tprops}/>;
    },

    /**
     * 安装插件，并返回最终的编辑器实例
     * @param plugins 要安装的插件
     * @param editorProps 编辑器属性
     * @returns 编辑器实例
     */
    editor: (plugins: XMarkPlugin[], editorProps?: EditorProps) => {
        let editor: ReactEditor = withReact(withHistory(createEditor()));
        editor.editorProps = editorProps;

        for (let i = 0; i < plugins.length; i++) {
            let plugin = plugins[i];
            if (plugin.install) {
                editor = plugin.install(editor);
            }
        }
        
        editor.catalogNoMap = catalogNoMap(plugins);
        return editor;
    }
}