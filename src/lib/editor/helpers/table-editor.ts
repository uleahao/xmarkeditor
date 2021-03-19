
import { Editor, Node, Path, Transforms, Element } from 'slate'
import { ReactEditor } from 'slate-react'
import utils from '../../utils/utils'
import {SelectedCells} from './table-utils'
import XMarkHelper, { ElementType } from './xmark-helper'

const DEFAULT_ROW_HEIGHT = 32;
const DEFAULT_CELL_WIDTH = 100;

export type ColData = {
    width: number
}
export type RowData = {
    height: number
}
export type TableData = {
    width: number,
    cols: ColData[],
    rows: RowData[],    
    [key: string]: any;
}

type TableCellDesc = {
    rowIndex: number,
    colIndex: number,
    cellIndex: number,
    rowSpan: number,
    colSpan: number,
}
type TableCells = {
    [key: string]: TableCellDesc,
}

const getTableCells = (table: Element): TableCells => {
    let tableCells: TableCells = {};

    let rows = table.children;
    rows.forEach((row, rowIndex) => {
        let cells = row.children;
        let colIndex = 0;
        cells.forEach((cell: any, cellIndex: number) => {
            let rowSpan = cell.rowSpan ? cell.rowSpan : 1;
            let colSpan = cell.colSpan ? cell.colSpan : 1;
            
            while (tableCells[`${rowIndex},${colIndex}`]) {
                colIndex += tableCells[`${rowIndex},${colIndex}`].colSpan;
            }
            let data: TableCellDesc = {
                rowIndex,
                colIndex,
                cellIndex,
                rowSpan,
                colSpan
            }
            for (let i = rowIndex; i < rowIndex + rowSpan; i++) {
                for (let j = colIndex; j < colIndex + colSpan; j++) {
                    tableCells[`${i},${j}`] = data;
                }
            }

            colIndex += colSpan;
        });        
    })
    
    return tableCells;
}

const insertTable = (editor: ReactEditor, rows = 3, cols = 3) => {
    let totalWidth = 748;
    let content = ReactEditor.toDOMNode(editor, editor);
    if ( content ) {
        let css = window.getComputedStyle(content);
        if (css) {
            let width = parseInt(css.width) - parseInt(css.paddingLeft) - parseInt(css.paddingRight) - 2;
            if (width > 0) {
                totalWidth = width;
            }
        }
    }
    let colWidth = totalWidth / cols;

    let data: TableData = {
        width: totalWidth,
        cols: [],
        rows: []
    }
    for(let j = 0; j < cols; j++) {
        let col = { width: colWidth, spans: 1}
        data.cols.push(col);
    }

    let table = { type: ElementType.Table, data, children: [] as Array<any> }
    for (let i = 0; i < rows; i++) {
        let row = { type: ElementType.TableRow, children: [] as Array<any>}
        table.children.push(row);
        for(let j = 0; j < cols; j++) {
            let col = { type: ElementType.TableCell, children: [{ text: ''}]}
            row.children.push(col);
        }
        data.rows.push({height: 32});
    }

    let path = XMarkHelper.getInsertPath(editor);
    Transforms.insertNodes(editor, table, {at: path})
}

const appendRow = (editor: ReactEditor, table: Element) => {
    let data: TableData = table.data;
    let cols = data.cols.length;
    let row = { type: ElementType.TableRow, children: [] as Array<any>}
    for(let i = 0; i < cols; i++) {
        let cell = { type: ElementType.TableCell, children: [{ text: ''}]}
        row.children.push(cell);
    }
    let path: Path = ReactEditor.findPath(editor, table);        
    let rowPath = [...path, table.children.length];
    
    Transforms.insertNodes(editor, row, { at: rowPath });

    data = utils.deepcopy(data);
    data.rows.push({height: DEFAULT_ROW_HEIGHT});

    Transforms.setNodes(editor, { data: data }, { at: path })
}

const insertRow = (editor: ReactEditor, table: Element, rowIndex: number, above: boolean = true) => {
    let data: TableData = table.data;
    let cells: TableCells = getTableCells(table);
    let tablePath: Path = ReactEditor.findPath(editor, table);        
    let row = { type: ElementType.TableRow, children: [] as Array<any>}

    for (let i = 0; i < table.data.cols.length; i++) {
        let cell = cells[`${rowIndex},${i}`];
        let insert = true;
        if (above) {
            if ( cell.rowIndex !== rowIndex  ) {
                insert = false;
            }
        }
        else {
            if ( cell.rowIndex + cell.rowSpan > rowIndex + 1 ) {
                insert = false;
            }            
        }
        if ( insert ) {
            row.children.push({ type: ElementType.TableCell, children: [{ text: ''}]});
        }
        else {
            Transforms.setNodes(editor, { 
                rowSpan: cell.rowSpan + 1     
            }, { at: [...tablePath, cell.rowIndex, cell.cellIndex] })
        }
    }

    let rowPath = [...tablePath, rowIndex];    
    if (!above) {
        rowPath = Path.next(rowPath);
    }
    Transforms.insertNodes(editor, row, { at: rowPath });

    data = utils.deepcopy(data);
    if ( !above ) {
        rowIndex ++;
    }
    
    data.rows.splice(rowIndex, 0, {height: DEFAULT_ROW_HEIGHT});

    Transforms.setNodes(editor, { data: data }, { at: tablePath })
}

const appendCol = (editor: ReactEditor, table: Element) => {
    let data: TableData = table.data;        
    let path: Path = ReactEditor.findPath(editor, table);
    
    for( let i = 0; i < data.rows.length; i++) {
        let cell = { type: ElementType.TableCell, children: [{ text: ''}]};
        let cellPath = [...path, i, table.children[i].children.length];
        Transforms.insertNodes(editor, cell, { at: cellPath });
    }
    data = utils.deepcopy(data);
    data.cols.push({width: DEFAULT_CELL_WIDTH});
    data.width += DEFAULT_CELL_WIDTH;

    Transforms.setNodes(editor, { data: data }, { at: path })
}

const getCellIndex = (cells: TableCells, rowIndex: number, colIndex: number) => {
    let cellIndex = 0;
    for (let i = 0; i < colIndex; i++) {
        let cell = cells[`${rowIndex},${i}`];
        if (cell.rowIndex === rowIndex) {
            cellIndex ++;
        }
    }
    return cellIndex;
}
const insertCol = (editor: ReactEditor, table: Element, colIndex: number, left: boolean = true) => {
    let data: TableData = table.data;        
    let cells: TableCells = getTableCells(table);
    let tablePath: Path = ReactEditor.findPath(editor, table);
    
    for (let i = 0; i < table.data.rows.length; i++) {
        let cell = cells[`${i},${colIndex}`];
        let insert = true;
        if ( left ) {
            if (cell.colIndex !== colIndex) {
                insert = false;
            }            
        }
        else {
            if (cell.colIndex + cell.colSpan > colIndex + 1) {
                insert = false;
            }            
        }    
        if (insert) {            
            let cellPath = [...tablePath, i, getCellIndex(cells, i, colIndex)];
            if (!left) {
                cellPath = Path.next(cellPath)
            }
            Transforms.insertNodes(editor, { type: ElementType.TableCell, children: [{ text: ''}]}, 
                { at: cellPath });
        }
        else {
            Transforms.setNodes(editor, { 
                colSpan: cell.colSpan + 1     
            }, { at: [...tablePath, cell.rowIndex, cell.cellIndex] })
        }
    }

    data = utils.deepcopy(data);
    data.cols.splice(colIndex, 0, {width: DEFAULT_CELL_WIDTH});
    data.width += DEFAULT_CELL_WIDTH;

    Transforms.setNodes(editor, { data: data }, { at: tablePath })
}
const removeRow = (editor: ReactEditor, table: Element, rowIndex: number) => {
    let data: TableData = table.data;
    if (data.rows.length === 1) {
        throw new Error('无法删除最后一行')
    }
    let cells: TableCells = getTableCells(table);
    for (let i = 0; i < table.data.cols.length; i++) {
        if (cells[`${rowIndex},${i}`].rowSpan > 1) {
            throw new Error('请拆分单元格后再删除行')
        }
    }
    
    let tablePath: Path = ReactEditor.findPath(editor, table);
    Transforms.removeNodes(editor, {at : [...tablePath, rowIndex]});

    data = utils.deepcopy(data);
    data.rows.splice(rowIndex, 1);
    Transforms.setNodes(editor, { data: data }, { at: tablePath })
}
const removeCol = (editor: ReactEditor, table: Element, colIndex: number) => {
    let cells: TableCells = getTableCells(table);
    let data: TableData = table.data;
    if (data.cols.length === 1) {
        throw new Error('无法删除最后一列')
    }
    for (let i = 0; i < data.rows.length; i++) {
        if (cells[`${i},${colIndex}`].colSpan > 1) {
            throw new Error('请拆分单元格后再删除列')
        }
    }

    let tablePath: Path = ReactEditor.findPath(editor, table);
    for (let i = 0; i < data.rows.length; i++) {
        let cell = cells[`${i},${colIndex}`];
        Transforms.removeNodes(editor, {at : [...tablePath, i, cell.cellIndex]});
    }
    data = utils.deepcopy(data);
    data.cols.splice(colIndex, 1);
    let width = 0;
    data.cols.forEach((col: any) => {
        width += col.width;
    });
    data.width = width;

    Transforms.setNodes(editor, { data: data }, { at: tablePath })
}

const mergeCells = (editor: ReactEditor, table: Element, selectedCells: SelectedCells) => {
    if (selectedCells.row1 === selectedCells.row2 && selectedCells.col1 === selectedCells.col2) {
        return;
    }
    let cells: TableCells = getTableCells(table);
    let ltCell = cells[`${selectedCells.row1},${selectedCells.col1}`];
    let rbCell = cells[`${selectedCells.row2},${selectedCells.col2}`];
    if (!ltCell || !rbCell) {
        return;
    }
    let removeCount: number[] = [];
    for (let i = selectedCells.row1; i <= selectedCells.row2; i++) {
        for (let j = selectedCells.col1; j <= selectedCells.col2; j++) {
            let cell = cells[`${i},${j}`];
            if (cell.rowIndex < selectedCells.row1 
                || cell.rowIndex + cell.rowSpan - 1 > selectedCells.row2 
                || cell.colIndex < selectedCells.col1
                || cell.colIndex + cell.colSpan - 1 > selectedCells.col2) {
                throw new Error('请将单元格完整包含后再合并');
            }
            if (cell !== ltCell
                && i === cell.rowIndex 
                && j === cell.colIndex) {
                    removeCount[i] = removeCount[i] ? removeCount[i] + 1 : 1;
            }
        }
    }
    for (let i = 0; i < table.children.length; i++) {
        if (removeCount[i] === table.children[i].children.length) {
            throw new Error('无法合并，请采用删除行方式编辑');
        }
    }

    let tablePath: Path = ReactEditor.findPath(editor, table);
    let cellPath: Path = [...tablePath, ltCell.rowIndex, ltCell.cellIndex];    
    let targetNode = Node.get(editor, cellPath)

    //将td的内容改为paragraph
    if (!Editor.isBlock(editor, targetNode.children[0])) {
        XMarkHelper.setContentType(editor, cellPath, ElementType.Paragraph)
    }
    //保留左上角td，其他全部合并
    let mergeNodes: Node[] = [];
    let targetNodeChildrenCount = targetNode.children.length;
    for (let i = selectedCells.row1; i <= selectedCells.row2; i++) {
        for (let j = selectedCells.col1; j <= selectedCells.col2; j++) {
            let cell = cells[`${i},${j}`];
            if (cell !== ltCell
                && i === cell.rowIndex 
                && j === cell.colIndex) {

                let path = [...tablePath, i, cell.cellIndex];
                let node = Node.get(editor, path)
                if (!Editor.isBlock(editor, node.children[0])) {
                    XMarkHelper.setContentType(editor, path, ElementType.Paragraph)
                }
                //将要合并td的子元素全部移到目标元素内
                for (let i = 0; i < node.children.length; i++) {
                    Transforms.moveNodes(editor, {at: [...path, 0], to: [...cellPath, targetNodeChildrenCount]});
                    targetNodeChildrenCount ++;
                }
                mergeNodes.push(node);
            }
        }
    }
    //删除合并后的td元素
    for (let i = mergeNodes.length - 1; i >= 0; i--) {
        let node = mergeNodes[i];
        let path = ReactEditor.findPath(editor, node);
        Transforms.removeNodes(editor, {at: path})
    }

    //设置左上角td的rowSpan和colSpan
    Transforms.setNodes(editor, { 
        rowSpan: rbCell.rowIndex + rbCell.rowSpan - ltCell.rowIndex,
        colSpan: rbCell.colIndex + rbCell.colSpan - ltCell.colIndex,        
    }, { at: cellPath })     
}

const splitCell = (editor: ReactEditor, table: Element, rowIndex: number, colIndex: number) => {
    let tablePath = ReactEditor.findPath(editor, table);
    let cells: TableCells = getTableCells(table);
    let cell = cells[`${rowIndex},${colIndex}`];
    
    for (let i = 0; i < cell.rowSpan; i++) {
        for (let j = 0; j < cell.colSpan; j++) {
            if (i === 0 && j === 0) {
                continue;
            }
            let cellPath = [...tablePath, cell.rowIndex + i, getCellIndex(cells, cell.rowIndex + i, cell.colIndex + j)];
            Transforms.insertNodes(editor, { type: ElementType.TableCell, children: [{ text: ''}]}, 
                { at: cellPath });
        }
    }

    let cellPath = [...tablePath, cell.rowIndex, cell.cellIndex];
    Transforms.setNodes(editor, { 
        rowSpan: 1,
        colSpan: 1,        
    }, { at: cellPath }) 
}

export default {
    insertTable,
    appendRow,
    appendCol,
    removeRow,
    removeCol,
    insertRow,
    insertCol,
    mergeCells,
    splitCell,
}