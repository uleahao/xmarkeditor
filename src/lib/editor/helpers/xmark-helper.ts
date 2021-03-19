import { Editor, Node, Element, Path, Text, Transforms, Range } from "slate";
import { ReactEditor } from "slate-react";

/**
 * 编辑器元素类型
 */
export const ElementType = {
    Paragraph: 'paragraph',
    Heading1: 'heading-1',
    Heading2: 'heading-2',
    Heading3: 'heading-3',
    Heading4: 'heading-4',
    Heading5: 'heading-5',
    Heading6: 'heading-6',
    Heading: 'heading-',
    BlockQuote: 'block-quote',
    HLine: 'h-line',

    //列表元素
    BulletedList: 'bulleted-list',
    NumberedList: 'numbered-list',
    TaskList: 'task-list',
    ListItem: 'list-item',

    Code: 'code',
    Draw: 'draw',
    Image: 'image',
    Link: 'link',

    //表格元素
    Table: 'table',
    TableRow: 'tr',
    TableCell: 'td',
}

const LIST_TYPES = [ElementType.NumberedList, ElementType.BulletedList, ElementType.TaskList];

const isList = (type: string) => {
    return LIST_TYPES.includes(type);
}

const isBlockActive = (editor: Editor, format: string) => {
    const [match] = Editor.nodes(editor, {
        match: n => n.type === format
    }) as Array<any>;

    return !!match;
};

const isListActive = (editor: Editor) => {
    const [match] = Editor.nodes(editor, {
        match: n => LIST_TYPES.includes(n.type)
    }) as Array<any>;

    return !!match;
};

const toggleList = (editor: Editor, format: string, value?: any) => {
    if (isListActive(editor)) {
        Transforms.setNodes(
            editor,
            {type: format, ...value},
            {
                match: n => LIST_TYPES.includes(n.type)
            }
        );
    }
    else {
        Transforms.wrapNodes(editor, {type: format, children:[]}, );
    }
}
const toggleBlock = (editor: Editor, format: string, value?: any) => {
    const isActive = isBlockActive(editor, format);
    const { selection } = editor
    
    if (selection && !Range.isCollapsed(selection)) {
        let count = 0;
        for (const [, path] of Editor.nodes(editor, {
            match: (n: Node) => n.type === ElementType.TableCell
        })) {
            setContentType(editor, path, ElementType.Paragraph);
            count++;
        }
        //不允许对多个table-cell同时做编辑操作
        if (count > 0) {
            return;
        }
    }
    const isList = LIST_TYPES.includes(format);
    if (isList) {
        toggleList(editor, format, value);
        return;
    }

    let hasHeading = format.startsWith(ElementType.Heading);
    let [headings] = Editor.nodes(editor, {
        match: (node) => node.type && node.type.startsWith(ElementType.Heading)
    })
    if (!!headings) {
        hasHeading = true;
    }
    
    let at = editor.selection;
    const matchPath = (editor: Editor, path: Path): ((node: Node) => boolean) => {
        const [node] = Editor.node(editor, path);
        return n => n === node && n.type !== ElementType.TableCell;
    };
    let match: (n: Node) => boolean;
    
    match = Path.isPath(at) ? matchPath(editor, at) : n => Editor.isBlock(editor, n);

    let attrs: any = { type: isActive ? ElementType.Paragraph : format }
    if ( attrs.type === format) {
        attrs = {...attrs, ...value}
    }
    Transforms.setNodes(
        editor,
        attrs,
        {
            match
        }
    );

    if (hasHeading) {
        updateCatalogNo(editor);
    }
};

const cleanMarks = (editor: Editor) => {
    let marks: any = {};
    let nodes = Editor.nodes(editor, {match: Text.isText})
    for (const [node] of nodes) {
        marks = {...marks, ...node}
    }
    delete marks['text'];
    
    Transforms.unsetNodes(editor, Object.keys(marks), {
        match: Text.isText,
        split: true,
    })
}

const isMarkActive = (editor: Editor, format: string) => {
    const marks = Editor.marks(editor);
    return marks ? marks[format] === true : false;
};
const toggleMark = (editor: Editor, format: string, value: any = true) => {
    const isActive = isMarkActive(editor, format);

    if (isActive) {
        Editor.removeMark(editor, format);
    } else {
        if (format === 'deleteline') {
            Editor.removeMark(editor, 'underline');
        }
        else if (format === 'underline') {
            Editor.removeMark(editor, 'deleteline');
        }
        Editor.addMark(editor, format, value);
    }
};

const setContentType = (editor: Editor, path: Path, type: string) => {
    let node = Node.get(editor, path);
    if (!Editor.isBlock(editor, node.children[0])) {
        let wrap = {
            type,
            children: [{ text: "" }]
        };

        Transforms.wrapNodes(editor, wrap, { at: [...path, 0] });
    } else {
        Transforms.setNodes(editor, { type }, { at: [...path, 0] });
    }
};

const getText = (element: Element): string => {
    let text = '';
    element.children.forEach(node => {
        if (node.text) {
            text += node.text;
        }
    })

    return text;
}

/**
 * 获取插入顶极元素的路径
 * @param editor 
 */
const getInsertPath = (editor: Editor): Path => {
    let path = editor.selection?.focus.path;
    if (Path.isPath(path)) {
        let ancestors = Path.ancestors(path);
        path = Path.next(ancestors[1]);
    }
    else if (editor.children.length > 0) {
        path = [editor.children.length];
    }
    else {
        path = [0];
    }
    return path;
}

/**
 * 目录
 */
export type Catalog = {
    title: string,          //标题
    key: string,            //关联字：索引号
    level: number,          //目录等级，1~6，1级最高
    path: Path,             //目录元素在编辑器中的路径
    element: Element,       //编辑元素
    catNo: string,          //目录编号
    children?: Catalog[],   //子目录
}

/**
 * 获取目录树
 * @param editorValue 编辑器值
 * @returns 目录结构
 */
const getCatalogTree = (editorValue: any[]): Catalog[] => {
    let tree: Catalog[] = [];
    let data: Catalog[] = [];

    editorValue.forEach((item, index) => {
        let level = getHeadingLevel(item.type);
        if (level === 0) {
            return;
        }
        let catalog: Catalog = {
            title: getText(item),
            level,
            key: `${index}`,
            path: [index],
            element: item,
            catNo: item.catNo ? item.catNo : '',
            children: []
        };
        let parentIndex = findParent(data, catalog.level);
        if (parentIndex >= 0) {
            let parent = data[parentIndex];
            parent.children?.push(catalog);
        }
        else {
            tree.push(catalog);
        }
        data.push(catalog);
    })

    return tree;
}

/**
 * 更新目录
 * @param editor
 */
const updateCatalogNo = (editor: Editor) => {
    let catalogs = getCatalogTree(editor.children);
    let catalogNoMap = editor.catalogNoMap || {};

    const updateNo = (catalogNoType: string, parentNo: string, catalogs: Catalog[]) => {
        let catalogNo = catalogNoMap[catalogNoType];

        catalogs.forEach((catalog, index) => {
            if (catalogNo) {
                catalog.catNo =catalogNo.generate(parentNo, index);
                Transforms.setNodes(editor, { catNo: catalog.catNo }, {at: catalog.path});
            }
            if (catalog.children && catalog.children.length > 0) {
                let childNoType = catalog.element.catNoType || 'default';
                updateNo(childNoType, catalog.catNo, catalog.children);
            }
        })
    }
    updateNo('default', '', catalogs);
}

const getHeadingLevel = (type: string): number => {
    switch (type) {
        case ElementType.Heading1:
            return 1
        case ElementType.Heading2:
            return 2
        case ElementType.Heading3:
            return 3
        case ElementType.Heading4:
            return 4
        case ElementType.Heading5:
            return 5
        case ElementType.Heading6:
            return 6
    }
    return 0;
}

const getHeadingType = (level: number): string => {
    switch (level) {
        case 1:
            return ElementType.Heading1
        case 2:
            return ElementType.Heading2
        case 3:
            return ElementType.Heading3
        case 4:
            return ElementType.Heading4
        case 5:
            return ElementType.Heading5
        case 6:
            return ElementType.Heading6
    }
    return ElementType.Heading6;
}

const findParent = (data: Catalog[], level: number): number => {
    for (let i = data.length - 1; i >= 0; i--) {
        if (data[i].level < level) {
            return i;
        }
    }
    return -1;
}

const setBlockAlign = (editor: Editor, align: string): boolean => {
    Transforms.setNodes(editor, {
        'style-textAlign': align
    }, 
    {
        match: (node) => Element.isElement(node)
    })
    return true;
}

const getBlockAlign = (editor: Editor): string => {
    let align = 'left';
    for (const [element, ] of Editor.nodes(editor, {
        match: (n: Node) => Element.isElement(n)
    })) {
        if (element['style-textAlign']) {
            align = element['style-textAlign']
        }
    }
    return align;
}

const getElementStyle = (element: Element): any => {
    let style: any = {};
    for (const key in element) {
        if (key.startsWith('style-')) {
            style[key.substring('style-'.length)] = element[key];
        }
    }
    return style;
}
const setElementStyle = (editor: ReactEditor, element: Element, style: any) => {
    let setting: any = {};
    for (const key in style) {
        setting[`style-${key}`] = style[key];
    }
    let path = ReactEditor.findPath(editor, element);
    Transforms.setNodes(editor, setting, { at: path});
}
export default {
    toggleBlock,
    isBlockActive,
    toggleMark,
    isMarkActive,
    setContentType,
    isList,
    getText,
    getInsertPath,
    updateCatalogNo,
    getHeadingLevel,
    getHeadingType,
    getCatalogTree,
    setBlockAlign,
    getBlockAlign,
    getElementStyle,
    setElementStyle,
    cleanMarks,
};
