import React, { useMemo, useEffect, useRef, useCallback } from 'react'
import { useReadOnly, useSelected, useFocused, useEditor } from 'slate-react'
import { cx, css } from 'emotion'
import XMarkHelper, { ElementType } from '../helpers/xmark-helper'
import { Dropdown, Menu } from 'antd';

export const Heading = (props: any) => {
    let {attributes, children, element} = props;
    const editor = useEditor()
    const readOnly = useReadOnly()
    const selected = useSelected()
    const focused = useFocused()
    const toolRef = useRef(null)

    const className = useMemo(() => {
        let catNo = element.catNo || '';
        return cx(css`
            &:before {
                content: '${catNo}';
                padding-right: 10px;
            }
        `)
    }, [element.catNo]);

    useEffect(() => {
        if (toolRef.current) {
            let tool = toolRef.current as unknown as HTMLElement;
            let height = tool.parentElement?.offsetHeight || 20;
            tool.style.marginTop = `${(height - tool.offsetHeight) / 2}px`;
        }
    })

    const style = useMemo(() => {
        return XMarkHelper.getElementStyle(element);
    }, [element])

    const headLevel = XMarkHelper.getHeadingLevel(element.type);

    const onChangeHeading = useCallback((level: string) => {
        XMarkHelper.toggleBlock(editor, 'heading-' + level)
    }, [editor]);

    const menu = (
        <Menu selectable selectedKeys={[`${headLevel}`]} onClick={item => onChangeHeading(item.key)}>
          <Menu.Item key="1"><h1>标题1</h1></Menu.Item>
          <Menu.Item key="2"><h2>标题2</h2></Menu.Item>
          <Menu.Item key="3"><h3>标题3</h3></Menu.Item>
          <Menu.Item key="4"><h4>标题4</h4></Menu.Item>
          <Menu.Item key="5"><h5>标题5</h5></Menu.Item>
          <Menu.Item key="6"><h6>标题6</h6></Menu.Item>          
        </Menu>
    );

    const heading = () => {
        switch (element.type) {
            case ElementType.Heading1:
                return <h1 {...attributes} style={style} className={className}>{children}</h1>
            case ElementType.Heading2:
                return <h2 {...attributes} style={style} className={className}>{children}</h2>
            case ElementType.Heading3:
                return <h3 {...attributes} style={style} className={className}>{children}</h3>
            case ElementType.Heading4:
                return <h4 {...attributes} style={style} className={className}>{children}</h4>
            case ElementType.Heading5:
                return <h5 {...attributes} style={style} className={className}>{children}</h5>
            case ElementType.Heading6:
                return <h6 {...attributes} style={style} className={className}>{children}</h6>
            default:
                return <h6 {...attributes} style={style} className={className}>{children}</h6>
        }
    }
    if (readOnly) {
        return (heading())
    }
    return (
        <div>
            <div contentEditable={false} ref={toolRef} className={cx(
                    'controller',
                    'heading-controller',
                    css`
                        display: ${selected && focused ? '' : 'none'};
                    `
                )}
            >
                <Dropdown overlay={menu} trigger={['click']} overlayStyle={{minWidth: 150}}
                    getPopupContainer={trigger => trigger.parentNode as HTMLElement}
                >
                    <span className="head-button">
                        H<span className="level">{headLevel}</span>
                    </span>
                </Dropdown>                
            </div>
            {heading()}
        </div>
    )
}