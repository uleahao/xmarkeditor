type HTMLTableDesc = {
    width: number,
    height: number,
    cols: {
        index: number,
        width: number
    }[],
    rows: {
        index: number,
        height: number
    }[],
    cells: {
        [key: string]: {
            rowIndex: number,
            colIndex: number,
            rowSpan: number,
            colSpan: number,
            td: HTMLTableCellElement
        },
    }
}

const getTableDesc = (table: HTMLTableElement) => {
    let data: HTMLTableDesc = {
        width: table.offsetWidth, 
        height: table.offsetHeight,
        cols:[], 
        rows:[],
        cells: {}
    };

    let cols = table.querySelectorAll('colgroup col');
    cols.forEach((item, index) => {
        let colItem: HTMLTableColElement = item as HTMLTableColElement;
        data.cols[index] = {
            index: index,
            width: parseInt(colItem.style.width),
        }
    });
    
    for(let i = 0; i < table.rows.length; i++) {
        let tr: HTMLTableRowElement = table.rows[i];
        let trIndex = tr.rowIndex;

        data.rows[trIndex] = {
            index: trIndex,
            height: tr.offsetHeight,
        };

        let tdIndex = 0;
        for(let j = 0; j < tr.cells.length; j++ ) {
            let td: any = tr.cells.item(j);
            
            while (data.cells[`${trIndex},${tdIndex}`]) {
                tdIndex += data.cells[`${trIndex},${tdIndex}`].colSpan;
            }
            let cell = {
                rowIndex: trIndex,
                colIndex: tdIndex,
                rowSpan: td.rowSpan,
                colSpan: td.colSpan,
                td: td
            }
            for(let r = trIndex; r < trIndex + td.rowSpan; r++) {
                for(let c = tdIndex; c < tdIndex + td.colSpan; c++) {
                    data.cells[`${r},${c}`] = cell;
                }
            }

            tdIndex += td.colSpan;
        }
    }
    return data;
}

const getColIndex = (td: HTMLTableCellElement ): number => {
    let table = td.closest('table') as HTMLTableElement;
    let els = table.querySelectorAll('colgroup col');
    let cols: any = [];
    els.forEach((item, index) => {
        let colItem: HTMLTableColElement = item as HTMLTableColElement;
        cols[index] = {
            index: index,
            width: parseInt(colItem.style.width),
        }
    });

    let pos = td.offsetLeft + td.offsetWidth / 2;
    let curpos = 0;
    for (let i = 0; i < cols.length; i++ ) {
        curpos += cols[i].width;
        if ( pos < curpos) {
            return i;
        }
    }
    
    return -1
}

const getRowIndex = (td: HTMLTableCellElement ): number => {
    let tr = td.parentElement as HTMLTableRowElement;
    
    return tr.rowIndex;
}


export type SelectedArea = {
    left: number, 
    top: number, 
    right: number, 
    bottom: number
}
export type SelectedCells = {
    col1: number,
    row1: number,
    col2: number,
    row2: number
}

const getSelectedArea = (table: HTMLTableElement, selectedCells: SelectedCells): SelectedArea => {
    let area: SelectedArea = {left: 0, top: 0, right: 0, bottom: 0};
    if (selectedCells.col1 < 0 || selectedCells.row1 < 0) {
        return area;
    }
    let tableDesc = getTableDesc(table);
    let ltCell = tableDesc.cells[`${selectedCells.row1},${selectedCells.col1}`];
    if (!ltCell) {
        return area;
    }
    let ltTD = ltCell.td;
    let rbTD;
    if (selectedCells.row2 < 0 || selectedCells.col2 < 0) {
        rbTD = ltTD;
    }
    else {
        let row1 = Math.min(selectedCells.row1, selectedCells.row2);
        let col1 = Math.min(selectedCells.col1, selectedCells.col2);
        let row2 = Math.max(selectedCells.row1, selectedCells.row2);
        let col2 = Math.max(selectedCells.col1, selectedCells.col2);

        ltCell = tableDesc.cells[`${row1},${col1}`];
        let rbCell = tableDesc.cells[`${row2},${col2}`];
        ltTD = ltCell.td;
        rbTD = rbCell.td;
    }

    area.left = ltTD.offsetLeft;
    area.top = ltTD.offsetTop;
    area.right = rbTD.offsetLeft + rbTD.offsetWidth;
    area.bottom = rbTD.offsetTop + rbTD.offsetHeight;

    return area;
}

export default {
    getTableDesc,
    getColIndex,
    getRowIndex,
    getSelectedArea,
    NoneSelectedArea: {col1: -1, row1: -1, col2: -1, row2: -1}
}