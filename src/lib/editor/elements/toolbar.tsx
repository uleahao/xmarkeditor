import React, { useCallback, useState, useEffect } from 'react'
import { cx, css } from 'emotion'
import { ReactEditor, useSlate } from 'slate-react'
import { ToolbarGroup, ToolButtonProps, ToolMenuProps, ToolButtonActionResult } from '../xmark-plugin'
import XMarkHelper from '../helpers/xmark-helper'
import { Dropdown, Menu, Button, Tooltip, message } from 'antd';
import { CaretDownOutlined } from '@ant-design/icons'

export const ToolButton = (
    (props: { [key: string]: any }) => {
        let { className, active, tooltip, enabled } = props;
        let button = (
            <div
                {...props}
                className={cx(
                    'tool-button',
                    className,
                    active === true || active === 'true' ? 'tool-button-active' : '',
                    enabled === false || enabled === 'false' ? 'disabled' : ''
                )}
            >
                
            </div>        
        )
        
        if (tooltip) {
            return <Tooltip title={tooltip}>
                {button}
            </Tooltip>
        }
        else return button
    }
)


export const ToolIcon = React.forwardRef<HTMLElement, { [key: string]: any }>(({ className, ...props }, ref) => (
    <i
        {...props}
        ref={ref}
        className={cx(
            'tool-icon',
            'iconfont',
            className
        )}
    />
))

export const ToolMenu = React.forwardRef<HTMLDivElement, { [key: string]: any }>(({ className, ...props }, ref) => (
    <div
        {...props}
        ref={ref}
        className={cx(
            className,
            css`
                & > * {
                display: inline-block;
                }

                & > * + * {
                margin-left: 3px;
                }
            `
        )}
    />
))

export type ToolbarProps = {
    className?: string,
    groups?: ToolbarGroup[],
    renderToolButton?: ((props: ToolButtonProps) => JSX.Element | undefined);
}

export const Toolbar = React.forwardRef<HTMLDivElement, ToolbarProps>((props, ref) => {
    let { className, groups, renderToolButton } = props;
    let children: JSX.Element[] = [];
    if (groups) {
        groups.forEach((item, index) => {
            let { name, buttons } = item;
            let elements: JSX.Element[] = [];
            buttons.forEach((value, index) => {
                let element: JSX.Element | undefined;

                switch (value.button) {
                    case 'mark-button':
                        element = <MarkButton {...value} key={value.type} />
                        break;
                    case 'block-button':
                        element = <BlockButton {...value} key={value.type} />
                        break;
                    case 'action-button':
                        element = <ActionButton {...value} key={value.type} />
                        break;
                    case 'menu-button':
                        element = <MenuButton {...value} key={value.type} />
                        break;
                    default:
                        if (renderToolButton) {
                            element = renderToolButton(value);
                        }
                }
                if (element) {
                    elements.push(element);
                }
            });
            if (elements.length > 0) {
                if (index > 0)
                    children.push(<span className={'toolbar-group'} group-name={name} key={name} />);
                children.push(...elements);
            }
        })
    }

    return (
        <ToolMenu
            ref={ref}
            className={cx(
                className,
                css`
                    position: relative;
                    padding: 5px 18px 5px;
                    margin: 0 -10px;
                    border-bottom: 1px solid #eee;
                `
            )}
        >
            {children}
        </ToolMenu>
    )
})


export const MarkButton = (props: { type: string; icon: string; tooltip?: string}) => {
    const editor = useSlate()
    return (
        <ToolButton
            className={"mark-button"}
            active={`${XMarkHelper.isMarkActive(editor, props.type)}`}
            onMouseDown={(event: MouseEvent) => {
                event.preventDefault()
                XMarkHelper.toggleMark(editor, props.type)
            }}
            tooltip={props.tooltip}
        >
            <ToolIcon className={props.icon}></ToolIcon>
        </ToolButton>
    )
}


export const BlockButton = (props: { type: string; icon: string; tooltip?: string}) => {
    const editor = useSlate()
    return (
        <ToolButton
            className={"block-button"}
            active={`${XMarkHelper.isBlockActive(editor, props.type)}`}
            onMouseDown={(event: MouseEvent) => {
                event.preventDefault()
                XMarkHelper.toggleBlock(editor, props.type)
            }}
            tooltip={props.tooltip}
        >
            <ToolIcon className={props.icon}></ToolIcon>
        </ToolButton>
    )
}

export const ActionButton = (props: any) => {
    const editor = useSlate()
    return (
        <ToolButton
            onMouseDown={(event: MouseEvent) => {
                event.preventDefault()
                let enabled = props.enabled ? props.enabled() : true;
                if (props.action && enabled)
                    props.action(editor, props)
            }}
            tooltip={props.tooltip}
            enabled={`${props.enabled ? props.enabled(editor, props) : true}`}
        >
            <ToolIcon className={props.icon}></ToolIcon>
            {props.label &&
                <span className="label">{props.label}</span>
            }
        </ToolButton>
    )
}

/**
 * 生成带标题的工具栏按钮属性定义
 * @param type 
 * @param label 
 * @param callback 
 * @param enabled 
 */
export const actionLabelButton = (type: string, label: string, callback: (editor: ReactEditor, data: any) => void, enabled?: (editor?: ReactEditor, data?: any) => boolean): ToolButtonProps => {
    return {
        button: 'action-button',
        type: type,
        icon: `icon-${type}`,
        label: label,
        action: (editor: ReactEditor, data: any) => {
            try {
                callback(editor, data);
            }
            catch(e) {
                message.error(e.message)
            }                
        },
        enabled: (editor: ReactEditor, data?: any) => enabled ? enabled(editor, data) : true
    }
}

/**
 * 生成带tooltip的工具栏按钮属性定义
 * @param type 
 * @param tooltip 
 * @param callback 
 * @param enabled 
 */
export const actionButton = (type: string, tooltip: string, callback: (editor: ReactEditor, data: any) => void, enabled?: (editor?: ReactEditor, data?: any) => boolean): ToolButtonProps => {
    return {
        button: 'action-button',
        type: type,
        icon: `icon-${type}`,
        tooltip: tooltip,
        action: (editor: ReactEditor, data: any) => {
            try {
                callback(editor, data);
            }
            catch(e) {
                message.error(e.message)
            }                
        },
        enabled: (editor: ReactEditor, data?: any) => enabled ? enabled(editor, data) : true
    }
}

export const MenuButton = (props: any) => {
    let { name, dropdownMenu, maxDropdownHeight } = props;
    const editor = useSlate()
    const [title, setTitle] = useState(name)
    const [icon, setIcon] = useState(props.icon)
    const [ disabled, setDisabled ] = useState(false)

    const updateResult = (result: ToolButtonActionResult) => {
        if (result) {
            if (result.setTitle)
                setTitle(result.setTitle);
            if (result.setIcon)
                setIcon(result.setIcon);
        }
    }
    const onAction = useCallback((item: any) => {
        let { item: { props } } = item;

        if (props.action) {
            let result: ToolButtonActionResult = props.action(editor, props);
            updateResult(result);
        }
    }, [editor])

    useEffect(() => {
        if (props.sync) {
            updateResult(props.sync(editor));
        }
        if (props.enabled) {
            setDisabled(!props.enabled(editor))
        }
    }, [editor, props])

    const menu = (
        <Menu onClick={item => onAction(item)}>
            {
                dropdownMenu.map((item: ToolMenuProps, index: number) => {
                    if (item.children) {
                        return <Menu.SubMenu title={item.title}>
                            {
                                item.children.map((item: ToolMenuProps, index: number) => {
                                    return <Menu.Item key={item.title} {...item}>
                                        <ToolIcon className={'menu-icon'}>{item.icon}</ToolIcon>
                                        <span style={{ padding: '0 5px' }}>{item.title}</span>
                                    </Menu.Item>
                                })
                            }
                        </Menu.SubMenu>
                    }
                    return <Menu.Item key={item.title} {...item}>
                        <ToolIcon className={'menu-icon ' + item.icon}></ToolIcon>
                        <span style={{ padding: '0 5px' }}>{item.title}</span>
                    </Menu.Item>
                })
            }
        </Menu>
    );

    return (
        <div onMouseDown={event => event.preventDefault()}
            className={cx(
                'tool-button-dropdown',
                disabled ? 'disabled' : ''
            )} style={{ marginLeft: 7 }}
        >
            <Dropdown overlay={menu} overlayClassName={maxDropdownHeight > 0 ? 'max-dropdown-height' : ''}
                overlayStyle={maxDropdownHeight > 0 ? {maxHeight: maxDropdownHeight} : {}}
                getPopupContainer={trigger => trigger.parentNode as HTMLElement}
                disabled={disabled}
            >
                <Button style={{ borderRadius: 4 }} size={"small"}>
                    <ToolIcon className={icon}></ToolIcon>
                    { title && 
                        <span style={{ minWidth: props.minWidth || 30 }}>{title}</span>
                    }                    
                    <CaretDownOutlined style={{ marginLeft: 3 }} />
                </Button>
            </Dropdown>
        </div>
    )
}