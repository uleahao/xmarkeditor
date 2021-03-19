import { Editor, Range, Point, Transforms, Node, Element } from 'slate'
import React, { useCallback, useState, useEffect, useRef, SyntheticEvent } from 'react';
import { ReactEditor, useEditor, useReadOnly, useSelected, useFocused } from 'slate-react'
import XMarkPlugin from '../xmark-plugin'
import { Toolbar, ToolbarProps, actionButton } from '../elements/toolbar'
import { cx, css } from 'emotion'
import { ResizableBox } from 'react-resizable';
import { PlusOutlined } from '@ant-design/icons'
import XMarkHelper, { ElementType } from '../helpers/xmark-helper'
import TableEditor, {TableData} from '../helpers/table-editor'
import TableUtil, {SelectedArea, SelectedCells} from '../helpers/table-utils'
import utils from '../../utils/utils'

export const TablePlugin: XMarkPlugin = {
    install: (editor: ReactEditor) => {
        const { normalizeNode, deleteBackward, deleteForward, insertBreak } = editor

        editor.normalizeNode = entry => {
            const [node, path] = entry
        
            if (Element.isElement(node) && node.type === ElementType.Table) {
                for (const [child, childPath] of Node.children(editor, path)) {
                    if (Element.isElement(child)) {
                        if (child.type !== ElementType.TableRow) {
                            Transforms.wrapNodes(editor, {type: ElementType.TableRow, children: []}, { at: childPath })
                            return
                        }
                    }
                }
            }
            if (Element.isElement(node) && node.type === ElementType.TableRow) {
                for (const [child, childPath] of Node.children(editor, path)) {
                    if (Element.isElement(child)) {
                        if (child.type !== ElementType.TableCell) {
                            Transforms.wrapNodes(editor, {type: ElementType.TableCell, children: []}, { at: childPath })
                            return
                        }
                    }
                }
            }
        
            // Fall back to the original `normalizeNode` to enforce other constraints.
            normalizeNode(entry)
        }

        editor.deleteBackward = unit => {
            const { selection } = editor

            if (selection && Range.isCollapsed(selection)) {
                const [cell] = Editor.nodes(editor, {
                    match: n => n.type === ElementType.TableCell,
                }) as Array<any>

                if (cell) {
                    const [cellNode, cellPath] = cell
                    const start = Editor.start(editor, cellPath)

                    if (Point.equals(selection.anchor, start)) {   
                        const child = cellNode.children[0];
                        if (Editor.isBlock(editor, child) && child.type !== ElementType.Paragraph) {
                            Transforms.setNodes(editor, {type: ElementType.Paragraph}, {at: [...cellPath, 0]})
                        }
                        else if (cellNode.children.length > 1) {
                            Transforms.removeNodes(editor, {at: [...cellPath, 0]})
                        }
                        return
                    }
                }
            }

            deleteBackward(unit)
        }

        editor.deleteForward = unit => {
            const { selection } = editor

            if (selection && Range.isCollapsed(selection)) {
                const [cell] = Editor.nodes(editor, {
                    match: n => n.type === ElementType.TableCell,
                }) as Array<any>

                if (cell) {
                    const [, cellPath] = cell
                    const end = Editor.end(editor, cellPath)

                    if (Point.equals(selection.anchor, end)) {
                        return
                    }
                }
            }

            deleteForward(unit)
        }

        editor.insertBreak = () => {
            const { selection } = editor

            if (selection) {
                let [tableMatch] = Editor.nodes(editor, { match: n => n.type === ElementType.Table}) as Array<any>

                if (tableMatch) {
                    let domSelection = window.getSelection()
                    if (domSelection && domSelection.focusNode) {
                        let el = domSelection.focusNode as HTMLElement;
                        if (typeof el.className === 'string' && el.className.indexOf('xmark-table-wrapper') >= 0) {
                            let [table, path] = tableMatch
                            path = ReactEditor.findPath(editor, table)
                            if (domSelection.focusOffset === 2) {
                                //在表格前插入空行
                                Transforms.insertNodes(editor, { type: ElementType.Paragraph, children: [{ text: ''}]}, {at: path, mode:'highest'});
                            }
                            else if (domSelection.focusOffset === 3) {
                                //在表格后插入空行
                                Transforms.insertNodes(editor, { type: ElementType.Paragraph, children: [{ text: ''}]}, {mode:'highest'});
                            }
                            return;
                        }
                    }

                    let match = Editor.nodes(editor, { match: n => n.type === ElementType.TableCell})
                    if (match) {
                        let cells = Array.from(match);
                        //在单元格中插入空行
                        if (cells.length === 1) {
                            let [cell, path] = cells[0];
                            if (!Editor.isBlock(editor, cell.children[0])) {
                                XMarkHelper.setContentType(editor, path, ElementType.Paragraph);
                            }
                        }
                        if (cells.length <= 1) {
                            insertBreak()
                        }
                    }
                    return;
                }
            }

            insertBreak()
        }
        
        return editor;
    },
    renderElement: (props) => {
        const { attributes, children, element } = props
        let style = XMarkHelper.getElementStyle(element);

        switch (element.type) {
            case ElementType.Table:
                return <XMarkTable {...props} data={element.data} style={style}/>
            case ElementType.TableRow:
                return <tr {...attributes} style={style}>{children}</tr>
            case ElementType.TableCell:
                return  <td {...attributes} style={style}
                            rowSpan={element.rowSpan ? element.rowSpan : 1}
                            colSpan={element.colSpan ? element.colSpan : 1}
                        >
                            {children}
                        </td>
        }
        return undefined;
    },
    
    insertMenu: [
        {
            title: '表格',
            icon: 'icon-table',
            action: (editor) => TableEditor.insertTable(editor)
        }
    ]
}

type TableDataOption = {
    forceUpdateRow?: number,
    forceUpdateCol?: number,
    updateValue?: boolean
}

const getTableData = (table: HTMLTableElement, data: TableData, options?: TableDataOption) => {
    let update: TableData = {
        ...utils.deepcopy(data),
        width: table.offsetWidth, 
        height: table.offsetHeight
    };

    let cols = table.querySelectorAll('colgroup col');
    let width = 0, updateWidth = false;
    cols.forEach((item, index) => {        
        let colItem: HTMLTableColElement = item as HTMLTableColElement;
        if (index < data.cols.length) {
            update.cols[index] = {...data.cols[index],
                width: parseInt(colItem.style.width) + (options && options.forceUpdateCol === index ? Math.random() * 0.001: 0),
            }
            width += parseInt(colItem.style.width);
        }
        else {
            updateWidth = true;
        }        
    });
    if (updateWidth) {
        update.width = width;
    }
        
    for(let i = 0; i < table.rows.length; i++) {
        let tr: HTMLTableRowElement = table.rows[i];
        let trIndex = i;

        update.rows[trIndex] = {...data.rows[trIndex],
            height: tr.offsetHeight + (options && options.forceUpdateRow === trIndex ? Math.random() * 0.001: 0),
        }
    }
    return update;
}

const EmptySelectedCells = {col1: -1, row1: -1, col2: -1, row2: -1};

export const XMarkTable = (props: any) => {
    const {attributes, children, element} = props;
    const [data, setData]: [TableData, any] = useState(utils.deepcopy(props.data));
    const editor = useEditor()
    const readOnly = useReadOnly()
    const selected = useSelected()    
    const focused = useFocused()
    const tableRef = useRef(null);
    const [dragging, setDragging] = useState(false);
    const [hilightedCols, setHilightedCols]: [number[], any] = useState([]);
    const [hilightedRows, setHilightedRows]: [number[], any] = useState([]);
    const [selectedCols, setSelectedCols]: [number[], any] = useState([]);
    const [selectedRows, setSelectedRows]: [number[], any] = useState([]);
    const [selectedArea, setSelectedArea]: [SelectedArea, any] = useState({left: 0, top: 0, right: 0, bottom: 0});
    const [selectedCells, setSelectedCells]: [SelectedCells, any] = useState(EmptySelectedCells);

    /**
     * 更新表格数据，以保持显示内容与数据的一致性
     */
    const updateTableData = useCallback((op?: TableDataOption) => {
        let table = tableRef.current as unknown as HTMLTableElement;
        let newData = getTableData(table, props.data, op);
        setData(newData);

        if (op?.updateValue) {
            const path = ReactEditor.findPath(editor, element)
            Transforms.setNodes(editor, { data: newData }, { at: path })
        }
        setSelectedArea(TableUtil.getSelectedArea(table, selectedCells));

    }, [props, editor, element, selectedCells]);

    useEffect(() => {
        updateTableData()

        const id = setInterval(() => {
            if (!dragging && selected)
                updateTableData()
        }, 500)
        return () => {
            clearInterval(id);
        }
    }, [props, updateTableData, dragging, selected])

    /**
     * 设置行高
     * @param rowIndex 
     * @param height 
     */
    const setRowHeight = (rowIndex: number, height: number) => {
        let table: HTMLTableElement = tableRef.current as unknown as HTMLTableElement;
        table.rows[rowIndex].style.height = height + 'px';
    }
    /**
     * 设置列宽
     */
    const setColWidth = useCallback((colIndex: number, width: number) => {
        let table: HTMLTableElement = tableRef.current as unknown as HTMLTableElement;
        let cols = table.querySelectorAll('colgroup col');
        let col: HTMLTableColElement = cols[colIndex] as HTMLTableColElement;
        col.style.width = width + 'px';
        let tableWidth: number = width;
        cols.forEach(item => {
            if (item !== col) {
                let colItem: HTMLTableColElement = item as HTMLTableColElement;
                tableWidth += parseInt(colItem.style.width);
            }
        });
        setData({...data, width: tableWidth})
    }, [data])
    
    /**
     * 选中一行
     */
    const onSelectRow = useCallback((rowIndex: number) => {
        setSelectedRows([rowIndex]);
        setSelectedCols([]);
        setHilightedCols([]);
        setHilightedRows([]);
        let cells: SelectedCells = {
            row1: rowIndex,
            col1: 0,
            row2: rowIndex,
            col2: data.cols.length - 1
        }
        setSelectedCells(cells);

        let table: HTMLTableElement = tableRef.current as unknown as HTMLTableElement;
        setSelectedArea(TableUtil.getSelectedArea(table, cells));

    }, [data]);

    /**
     * 选中一列
     */
    const onSelectCol = useCallback((colIndex: number) => {
        setSelectedRows([]);
        setSelectedCols([colIndex]);
        setHilightedCols([]);
        setHilightedRows([]);
        let cells: SelectedCells = {
            row1: 0,
            col1: colIndex,
            row2: data.rows.length -1,
            col2: colIndex
        }
        setSelectedCells(cells);

        let table: HTMLTableElement = tableRef.current as unknown as HTMLTableElement;
        setSelectedArea(TableUtil.getSelectedArea(table, cells));

    }, [data]);

    /**
     * 在单元格区块选择中选中了一个单元格
     * @param td 当前选中的单元格
     * @param isEnd 是否是区块选择的结束事件
     */
    const onSelectCell = useCallback((td: any, isEnd: boolean = false) => {
        if (isEnd) {
            setDragging(false);
        }
        else if (dragging === false) {
            setDragging(true);
        }
        
        if (!td || selectedCells.col1 < 0 || selectedCells.row1 < 0) {
            return;
        }
        let table = td.closest('table');
        if (table !== tableRef.current) {
            return;
        }
        
        let cells = {
            ...selectedCells, 
            row2: TableUtil.getRowIndex(td),
            col2: TableUtil.getColIndex(td)
        }
        let row1 = Math.min(cells.row1, cells.row2);
        let row2 = Math.max(cells.row1, cells.row2);
        let col1 = Math.min(cells.col1, cells.col2);
        let col2 = Math.max(cells.col1, cells.col2);
        cells = {
            row1: row1,
            col1: col1,
            row2: row2,
            col2: col2,
        }
        let desc = TableUtil.getTableDesc(table);
        for (let i = row1; i <= row2; i++) {
            for (let j = col1; j <= col2; j++) {
                let cell = desc.cells[`${i},${j}`];
                cells.row1 = Math.min(cells.row1, cell.rowIndex);
                cells.col1 = Math.min(cells.col1, cell.colIndex);
                cells.row2 = Math.max(cells.row2, cell.rowIndex + cell.rowSpan - 1);
                cells.col2 = Math.max(cells.col2, cell.colIndex + cell.colSpan - 1);
            }
        }
        
        let rows = [];
        for (let i = cells.row1; i <= cells.row2; i++) {
            rows.push(i);
        }
        setHilightedRows(rows);
        let cols = [];
        for (let i = cells.col1; i <= cells.col2; i++) {
            cols.push(i);
        }
        setHilightedCols(cols);

        if (isEnd) {
            setSelectedCells(cells);
        }
        setSelectedArea(TableUtil.getSelectedArea(table, cells));

    }, [selectedCells, dragging]);

    /**
     * 处理鼠标点击事件
     */
    const onWrapperMouseDownCapture = useCallback((event: any) => {
        if (typeof event.target.className == 'string' && event.target.className.indexOf('cell-selector-trigger') >= 0) {
            return;
        }

        let els: any[] = document.elementsFromPoint(event.clientX, event.clientY);
        let td: any = els.find(element => element.nodeName === 'TD');
        //选中一个单元格
        if (td) {
            setSelectedCols([]);
            setSelectedRows([]);

            let colIndex = TableUtil.getColIndex(td);
            let rowIndex = TableUtil.getRowIndex(td);
            setHilightedCols([colIndex]);
            setHilightedRows([rowIndex]);

            let cells: SelectedCells = {
                row1: rowIndex,
                col1: colIndex,
                row2: -1,
                col2: -1                
            }
            setSelectedCells(cells);
            let table = td.closest('table');
            setSelectedArea(TableUtil.getSelectedArea(table, cells))
        }
    }, []);

    const autoFitWidth = useCallback(() => {
        let table: HTMLTableElement = tableRef.current as unknown as HTMLTableElement;
        let wrapper: HTMLElement = table.closest('.xmark-table-wrapper') as HTMLElement;
        let tableWidth: number = wrapper.offsetWidth - 4;
        let diffWidth: number = tableWidth - data.width;

        let update: TableData = {
            ...utils.deepcopy(data),
            width: tableWidth, 
        };

        let cols = table.querySelectorAll('colgroup col');
        let adWidth = Math.floor(diffWidth / cols.length);
        tableWidth = 0;
        cols.forEach((item, index) => {
            let col: HTMLTableColElement = cols[index] as HTMLTableColElement;
            if (index < data.cols.length) {
                let colWidth = parseInt(col.style.width) + adWidth;
                col.style.width = colWidth + 'px';
                update.cols[index] = {...data.cols[index],
                    width: colWidth,
                }
                tableWidth += colWidth;
            }
        });
        table.style.width = tableWidth + 'px';
        update.width = tableWidth;
        setData(update);

    }, [data]);

    const tools: ToolbarProps = {
        groups: [
            {
                name: 'row-tools',
                buttons: [
                    actionButton('insert-row-above', '上方插入行', 
                        () => {
                            TableEditor.insertRow(editor, element, selectedCells.row1);
                            selectedCells.row1 ++;
                            selectedCells.row2 ++;
                        }, 
                        () => selectedCells.row1 > 0 && selectedCols.length === 0
                    ),
                    actionButton('insert-row-below', '下方插入行', 
                        () => {
                            TableEditor.insertRow(editor, element, selectedCells.row1, false)
                        }, 
                        () => selectedCells.row1 >= 0 && selectedCols.length === 0
                    ),
                    actionButton('delete-row', '删除选中行', 
                        () => {
                            if (selectedRows.length > 0) {
                                TableEditor.removeRow(editor, element, selectedRows[0]);
                                setSelectedRows([]);
                                setSelectedCells(EmptySelectedCells)
                            }
                        }, 
                        () => selectedRows.length > 0
                    ),
                ]
            },
            {
                name: 'col-tools',
                buttons: [
                    actionButton('insert-column-left', '左边插入列', 
                        () => {
                            TableEditor.insertCol(editor, element, selectedCells.col1)
                            selectedCells.col1 ++;
                            selectedCells.col2 ++;
                        }, 
                        () => selectedCells.col1 > 0 && selectedRows.length === 0
                    ),
                    actionButton('insert-column-right', '右边插入列', 
                        () => {
                            TableEditor.insertCol(editor, element, selectedCells.col1, false)
                        }, 
                        () => selectedCells.col1 >= 0 && selectedRows.length === 0
                    ),
                    actionButton('delete-column', '删除选中列', 
                        () => {
                            if (selectedCols.length > 0) {
                                TableEditor.removeCol(editor, element, selectedCols[0]);
                                setSelectedCols([]);
                                setSelectedCells(EmptySelectedCells)
                            }          
                        }, 
                        () => selectedCols.length > 0
                    ),
                ]
            },
            {
                name: 'cell-tools',
                buttons: [
                    actionButton('cell-merge', '合并单元格', 
                        () => {
                            TableEditor.mergeCells(editor, element, selectedCells);
                        },
                        () => selectedCells.row2 > selectedCells.row1 || selectedCells.col2 > selectedCells.col1
                    ),
                    actionButton('cell-split', '拆分单元格', 
                        () => {
                            TableEditor.splitCell(editor, element, selectedCells.row1, selectedCells.col1);
                        }, 
                        () => selectedCells.row1 >= 0 && selectedCells.col1 >= 0 && selectedCells.row2 < 0 && selectedCells.col2 < 0
                    ),
                ]
            },
            {
                name: 'other-tools',
                buttons: [
                    actionButton('fit-width', '自动调整宽度', autoFitWidth),
                    actionButton('delete', '删除表格', () => {
                        let path = ReactEditor.findPath(editor, element);
                        Transforms.removeNodes(editor, {at: path});
                    }),
                ]
            }
        ]
    }

    const innerTable = (
        <table ref={tableRef} style={{width: data.width + 'px'}}>
            <colgroup contentEditable={false}>
                {
                    data.cols.map((item: any, index: number) => {
                        return <col key={index} style={{width: item.width + 'px'}} span={1}></col>
                    })
                }
            </colgroup>
            <tbody >{children}</tbody>
        </table>
    )
    if (readOnly) {
        return (
            <div {...attributes} className={'xmark-table'} >
                {innerTable}
            </div>
        )
    }

    return (
        <div {...attributes} className={cx('xmark-table', selected && focused ? 'editing' : '')} >             
            <div className={cx('xmark-table-wrapper', selected && focused ? 'editing' : '')} 
                onMouseDownCapture={onWrapperMouseDownCapture}
            >
                <div className={cx(
                    'xmark-table-cols-header',
                    css`
                        display: ${selected && focused ? '' : 'none !important'};
                    `
                )} contentEditable={false}>
                    {
                        data.cols.map((item: any, index: number) => {
                            return <ColHeader key={index} data={item} 
                                selected={selectedCols.indexOf(index) >= 0}
                                hilighted={hilightedCols.indexOf(index) >= 0}
                                onResize={(width: number) => {
                                    setColWidth(index, width);
                                }}
                                onSelected={() => onSelectCol(index)}
                                onResizeStart={() => {
                                    setDragging(true)
                                    setSelectedArea(TableUtil.NoneSelectedArea)
                                }}
                                onResizeStop={() => {
                                    setDragging(false)
                                    updateTableData({forceUpdateCol: index, updateValue: true});
                                }}
                            />
                        })
                    }
                    <div className="cols-add cols-header-item" onClick={()=>TableEditor.appendCol(editor, element)}><PlusOutlined style={{verticalAlign: 0}} /></div>
                </div>
                <CellSelector area={selectedArea} onSelectCell={onSelectCell} onSelectCellEnd={(td: any) => onSelectCell(td, true)}/>
                {innerTable}
            </div>         
            <div contentEditable={false} className={cx(
                    'xmark-table-controler',
                    css`
                        display: ${selected ? '' : 'none'};
                    `
                )}                
            >
                <Toolbar {...tools} className={cx(
                    'card-toolbar',
                    selected ? 'card-toolbar-focused': ''
                )} />                
                <div className="xmark-table-rows-header">
                    {
                        data.rows.map((item, index) => {
                            return <RowHeader key={index} data={item} 
                                selected={selectedRows.indexOf(index) >= 0}
                                hilighted={hilightedRows.indexOf(index) >= 0}
                                onResize={(height: number) => {
                                    setRowHeight(index, height);
                                }}
                                onSelected={() => {onSelectRow(index)}}
                                onResizeStart={() => {
                                    setDragging(true)
                                    setSelectedArea(TableUtil.NoneSelectedArea)
                                }}
                                onResizeStop={() => {
                                    setSelectedArea(TableUtil.NoneSelectedArea)
                                    updateTableData({forceUpdateRow: index, updateValue: true});
                                }}
                            />
                        })
                    }
                    <div className="rows-add rows-header-item" onClick={()=>TableEditor.appendRow(editor, element)}><PlusOutlined style={{verticalAlign: 0}}/></div>
                </div>
            </div>
            
        </div>
    )
}

const ColHeader = (props: any) => {
    const {attributes, children, data, selected, hilighted} = props;
    
    const onResize = (e: SyntheticEvent, data:any) => {
        if (props.onResize) {
            props.onResize(data.size.width);
        }
    }
    const onResizeStart = () => {
        if (props.onResizeStart) {
            props.onResizeStart();
        }
    }
    const onResizeStop = () => {
        if (props.onResizeStop) {
            props.onResizeStop();
        }
    }
    const onClick = () => {
        if (props.onSelected) {
            props.onSelected();
        }
    }
    const handle = (
        <span className={cx(
            'resize-handle',
            'resize-handle-e',
            selected ? 'actived' : ''            
        )}/>
    )
    return (
        <ResizableBox {...attributes} className={cx(
            'cols-header-item',
            hilighted ? 'hilighted': '',
            selected ? 'selected': '',
            css`
                width: ${data.width}px;
            `
        )}
            draggableOpts={{enableUserSelectHack:false}}
            width={data.width} height={Infinity} 
            handleSize={[8, 20]} handle={handle}
            minConstraints={[10, 15]} maxConstraints={[Infinity, Infinity]}
            onResize={onResize} onResizeStart={onResizeStart} onResizeStop={onResizeStop}
        >
            <div style={{height: '100%'}} onClick={onClick}>
                {children}
            </div>            
        </ResizableBox>
    )
}
const RowHeader = (props: any) => {
    const {attributes, children, data, selected, hilighted} = props;
    
    const onResize = (e: SyntheticEvent, data:any) => {
        if (props.onResize) {
            props.onResize(data.size.height);
        }
    }
    const onResizeStart = () => {
        if (props.onResizeStart) {
            props.onResizeStart();
        }
    }
    const onResizeStop = () => {
        if (props.onResizeStop) {
            props.onResizeStop();
        }
    }
    const onClick = () => {
        if (props.onSelected) {
            props.onSelected();
        }
    }
    const handle = (
        <span className={cx(
            'resize-handle',
            'resize-handle-s',
            selected ? 'actived' : ''
        )}/>
    )
    return (
        <ResizableBox {...attributes} className={cx(
            'rows-header-item',
            hilighted ? 'hilighted': '',
            selected ? 'selected': '',
            css`
                height: ${data.height}px;
            `
        )}
            draggableOpts={{enableUserSelectHack:false}}
            width={Infinity} height={data.height} 
            handleSize={[20, 8]} handle={handle}
            minConstraints={[15, 10]} maxConstraints={[Infinity, Infinity]}
            onResize={onResize} onResizeStart={onResizeStart} onResizeStop={onResizeStop}
        >
            <div style={{height: '100%'}} onClick={onClick}>
                {children}
            </div> 
        </ResizableBox>
    )
}

let lastTD: any;

const CellSelector = (props: any) => {
    const {attributes, children, onSelectCellEnd, onSelectCell} = props;
    const selected = useSelected() 
    const area = props.area || {left: 0, top: 0, right: 0, bottom: 0};

    const onMouseMove = useCallback((event: any) => {
        if (onSelectCell) {            
            let td;
            if (event.target.nodeName === 'TD') {
                td = event.target;
            }
            else {
                td = event.target.closest('td');
                if (!td) {
                    return;
                }
            }
            onSelectCell(td);
            lastTD = td;
        };
    }, [onSelectCell]);

    const onMouseUp = useCallback((event: any) => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        if (onSelectCellEnd) {
            if (event.target.nodeName === 'TD') {
                onSelectCellEnd(event.target);
            }
            else {
                onSelectCellEnd(lastTD);
            }
        };
    }, [onMouseMove, onSelectCellEnd]);

    const onMouseDown = useCallback((event: any) => {
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, [onMouseMove, onMouseUp]);
    
    return (
        <div {...attributes} contentEditable={false} className={cx(
            'cell-selector',
            css`
                display: ${area.left === area.right || !selected ? 'none' : ''};
                left: ${area.left}px;
                top: ${area.top}px;
            `
        )}>            
            <div className={cx(
                'cell-selector-border',
                'left',
                css`
                    top: 0;
                    left: 0;
                    width: 1px;
                    height: ${area.bottom - area.top}px;
                    border-right: 0 !important;
                `
            )}/>
            <div className={cx(
                'cell-selector-border',
                'top',
                css`
                    top: 0;
                    left: 0;
                    height: 1px;
                    width: ${area.right - area.left}px;
                    border-bottom: 0 !important;
                `
            )}/>
            <div className={cx(
                'cell-selector-border',
                'right',
                css`
                    top: 0;
                    left: ${area.right - area.left}px;
                    width: 1px;
                    height: ${area.bottom - area.top}px;
                    border-left: 0 !important;
                `
            )}/>
            <div className={cx(
                'cell-selector-border',
                'bottom',
                css`
                    top: ${area.bottom - area.top}px;
                    left: 0;
                    height: 1px;
                    width: ${area.right - area.left}px;
                    border-top: 0 !important;
                `
            )}/>
            <div className={cx(
                'cell-selector-trigger',
                'nw',
                css`
                    top: -4px;
                    left: -4px;
                `
            )} onMouseDown={onMouseDown}/>
            <div className={cx(
                'cell-selector-trigger',
                'se',
                css`
                    top: ${area.bottom - area.top - 4}px;
                    left: ${area.right - area.left - 4}px;
                `
            )} onMouseDown={onMouseDown}/>
            {children}
        </div>
    )
}