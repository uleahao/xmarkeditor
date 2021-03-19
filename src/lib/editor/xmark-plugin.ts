import { ReactEditor, RenderElementProps, RenderLeafProps } from "slate-react";
import { CSSProperties } from "react";

/**
 * 工具栏按钮
 */
export type ToolButtonProps = {
    /**
     * 按钮控件类型，根据按钮类型，由插件处理渲染
     */
    button: string;

    /**
     * 按钮动作类型
     */
    type: string;

    /**
     * 名称
     */
    name?: string;

    /**
     * 帮助说明
     */
    tooltip?: string;

    /**
     * 图标
     */
    icon: string;

    /**
     * 动作回调
     * @param editor 编辑器实例
     * @param data 自定义对象
     * @returns 按钮动作指令
     */
    action?: (editor: ReactEditor, data?: any) => ToolButtonActionResult | void;

    /**
     * 状态同步
     * @param editor 编辑器实例
     * @returns 按钮动作指令
     */
    sync?: (editor: ReactEditor) => ToolButtonActionResult | void;

    /**
     * 是否可用回调
     * @param editor 编辑器实例
     * @param data 自定义对象
     * @returns true/false
     */
    enabled?: (editor: ReactEditor, data?: any) => boolean;

    /**
     * 下拉菜单
     */
    dropdownMenu?: ToolMenuProps[];
    /**
     * 下拉菜单的最大高度
     */
    maxDropdownHeight?: number;

    [key: string]: any;
};

/**
 * 按钮动作指令
 */
export type ToolButtonActionResult = {
    /**
     * 设置标题
     */
    setTitle?: string;
    
    /**
     * 设置图标
     */
    setIcon?: string;
};


/**
 * 工具栏菜单
 */
export type ToolMenuProps = {
    /**
     * 菜单标题
     */
    title: string;

    /**
     * 菜单图标
     */
    icon: string;

    /**
     * 菜单动作回调
     */
    action?: (editor: ReactEditor, data?: any) => void;

    /**
     * 子菜单
     */
    children?: ToolMenuProps[];
};

/**
 * 工具栏分组
 */
export type ToolbarGroup = {
    /**
     * 分组名称
     */
    name: string;

    /**
     * 分组按钮
     */
    buttons: ToolButtonProps[];
};

/**
 * 目录编号
 */
export type CatalogNo = {
    /**
     * 标题
     */
    title: string,

    /**
     * 编号生成回调
     * @param parentNo 父编号
     * @param index 目录索引
     * @returns 目录编号 
     */
    generate: (parentNo: string, index: number) => string;
}

/**
 * 插件接口
 */
interface XMarkPlugin {
    [key: string]: any;

    /**
     * Slate编辑器
     */
    editor?: ReactEditor;

    /**
     * 插件安装时的回调，按Slate链式插件方式安装
     * @param editor Slate编辑器
     * @returns 安装后的Slate编辑器
     */
    install?: (editor: ReactEditor) => ReactEditor;

    /**
     * 编辑元素渲染回调。
     * @param props 元素渲染属性
     * @returns 如果由此插件处理元素，则返回JSX.Element，否则不返回或返回undefined，交由其他插件处理
     */
    renderElement?: (props: RenderElementProps) => JSX.Element | undefined;

    /**
     * 编辑文本渲染回调。
     * @param props 文本渲染属性
     * @param style 文本样式，如果由此插件处理，则直接修改样式内容
     * @returns 如果由此插件处理文本，则返回渲染后的文本，否则返回props.children
     */
    renderLeaf?: (props: RenderLeafProps, style: CSSProperties) => JSX.Element;

    /**
     * 工具栏定义，所有插件的工具栏定义将根据工具栏分组和插件顺序自动合并
     */
    tools?: ToolbarGroup[];

    /**
     * 插入菜单定义，所有插件的插入菜单将按顺序在工具栏特定位置显示
     */
    insertMenu?: ToolMenuProps[];

    /**
     * 渲染工具栏按钮
     * @param props 工具栏按钮属性
     * @returns 如果由此工具栏处理则返回渲染后的JSX.Element，否则不返回或返回undefined，交由其他插件处理
     */
    renderToolButton?: (props: ToolButtonProps) => JSX.Element | undefined;

    /**
     * 目录编号
     */
    catalogNo?: {
        [key: string]: CatalogNo;
    }
}

/**
 * 上传文件
 */
export type UploadItem = {
    //文件对象
    file: File;
    //文件内容，如'image'表示图像
    type: string;
}

/**
 * 上传结果
 */
export type UploadResult = {
    //上传后的URL地址
    url: string;
    [key: string]: any;
}

/**
 * 编辑器属性，可以通过useEditor()获取编辑器editor后访问其editorProps获取，如：
 * <code>
 *  const editor = useEditor();
 *  const editorProps = editor.editorProps;
 *  ...
 * </code>
 */
export interface EditorProps {
    /**
     * 文件上传服务
     */
    onUpload?: (item: UploadItem) => Promise<UploadResult>;
    /**
     * 编辑器选项，插件通过该选项获取相应值，key的命名方式为: {插件}.{选项}
     */
    option?: {[key: string]: any;}
}

export default XMarkPlugin;
