import { Editor, Transforms } from 'slate'
import React, { useEffect, useMemo, useState, useCallback, useReducer } from 'react';
import { ReactEditor, useEditor, useReadOnly, useSelected } from 'slate-react'
import XMarkPlugin, { EditorProps } from '../xmark-plugin'
import { ElementType } from '../helpers/xmark-helper'
import { ToolbarProps, actionButton, actionLabelButton, Toolbar } from '../elements/toolbar'
import Viewer from 'react-viewer';
import { Card } from '../elements/card'
import ImageUploader from '../../components/image-uploader'
import ReactSwiper from '../../components/react-swiper';
import { Modal, Input, Form, Pagination, Checkbox, Radio, Row, Col, Divider, message } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons'


export const ImagePlugin: XMarkPlugin = {
    install: (editor: ReactEditor) => {
        const { isVoid } = editor

        editor.isVoid = element => {
            return element.type === ElementType.Image ? true : isVoid(element)
        }
        
        return editor;
    },
    renderElement: (props) => {
        const { element } = props
        switch (element.type) {
            case ElementType.Image:
                return <ImageCard {...props} />
        }
        return undefined;
    },
    
    insertMenu: [
        {
            title: '图片',
            icon: 'icon-image',
            action: (editor) => insertImage(editor)
        }
    ]
}

const insertImage = (editor: Editor) => {
    
    const image = { type: ElementType.Image, data: [], children: [{ text: ''}] }
    Transforms.insertNodes(editor, image)
    let selection = editor.selection;
    Transforms.insertNodes(editor, { type: ElementType.Paragraph, children: [{ text: ''}]})
    editor.selection = selection;
}

const WrapOptionsForm = ((props: any) => {
        const [ form ] = Form.useForm();
        const value: any = props.value || {};
        const options = [
            { label: '自动播放', value: 'autoplay' },
            { label: '导航按钮', value: 'navigation' },
        ];
        const effects = [
            { label: '滑动', value: 'slide' },
            { label: '淡入淡出', value: 'fade' },
            { label: '立方体', value: 'cube'},
            { label: '封面', value: 'coverflow'},
            { label: '翻转', value: 'flip'},
        ]
        const getValue = useCallback((callback: (err: any, values: any) => void) => {
            form.validateFields()
                .then(value => callback(null, value))
                .catch(reason => callback(reason, null))
        }, [form]);
        const reset = useCallback((callback: (err: any, values: any) => void) => {
            form.resetFields();
        }, [form]);

        useEffect(() => {
            form.setFieldsValue(value)

            if (props.onRef) {
                props.onRef({
                    getValue,
                    reset
                })
            }
        }, [props, getValue, reset, form, value])
        return (
            <Form form={form} className="small-form" layout="horizontal" labelCol={{span: 4}} wrapperCol={{offset: 4}}>
                <Form.Item label="选项" name='options'>
                    <Checkbox.Group options={options}>
                    </Checkbox.Group>
                </Form.Item>
                <Form.Item label="切换效果" name='effect'>
                    <Radio.Group options={effects}/>
                </Form.Item>
            </Form>
        )
    }
)
const WrapSettingForm = ((props: any) => {
        const { visible, onCancel, uploadFile } = props;
        const [ form ] = Form.useForm();
        const [ currentIndex, setCurrentIndex ] = useState(0);
        const [ items, setItems ] = useState<ImageData[]>([]);
        const option = props.option || {};

        let optionsForm: any = null;

        useEffect(() => {
            //Modal显示时初始化表单
            if (visible === true) {
                setItems(props.items);
                setCurrentIndex(0);
                if (props.items.length > 0) {
                    let url = '';
                    if (props.items[0].src && (props.items[0].src + '').toLowerCase().startsWith('http')) {
                        url = props.items[0].src;
                    }

                    form.setFieldsValue({
                        url: url,
                        alt: props.items[0].alt,
                        href: props.items[0].href
                    })
                }
            }            
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [visible])

        const onOk = () => {
            let option = {};
            if (optionsForm) {
                optionsForm.getValue((err: any, values: any) => {
                    if (err) {
                        message.error(err);
                    }
                    else {
                        option = values;
                    }
                });
            }
            form.validateFields().then(values => {
                if (props.onOk) {
                    updateItem().then(() => {
                        if (optionsForm) {
                            optionsForm.reset();
                        }
                        form.resetFields();
                        let data = [...items];
                        data[currentIndex] = {
                            ...data[currentIndex],
                            alt: values.alt,
                            href: values.href
                        }
                        if (values.url.toLowerCase().startsWith('http')) {
                            data[currentIndex].src = values.url
                        }
                        props.onOk(data, option)
                    })
                }
            }).catch(err => {
                message.error(err);
            })            
        }
        const updateItem = useCallback(() => {
            let promise = form.validateFields()
            promise.then(values => {
                let data = [...items];

                data[currentIndex] = {
                    ...data[currentIndex],
                    alt: values.alt,
                    href: values.href
                }
                if (values.url.toLowerCase().startsWith('http')) {
                    data[currentIndex].src = values.url
                }
                setItems(data);
            }).catch(reason => {
                message.error('请正确输入数据');
            })
            
            return promise;
        }, [currentIndex, form, items]);

        const onImageChange = useCallback((page: number) => {
            let index = page - 1;
            updateItem().then(() => {
                let url = '';
                if (items[index].src && (items[index].src + '').toLowerCase().startsWith('http')) {
                    url = items[index].src;
                }
                form.setFieldsValue({
                    url: url,
                    alt: items[index].alt,
                    href: items[index].href
                })
                setCurrentIndex(index);
            })
            
        }, [form, items, updateItem]);

        const movePrev = useCallback(() => {
            if (currentIndex > 0) {
                let images = [...items];
                let temp = images[currentIndex];
                images[currentIndex] = images[currentIndex - 1];
                images[currentIndex - 1] = temp;
                setItems(images);
                setCurrentIndex(currentIndex - 1);
            }
        }, [items, currentIndex])

        const moveNext = useCallback(() => {
            if (currentIndex < items.length - 1) {
                let images = [...items];
                let temp = images[currentIndex];
                images[currentIndex] = images[currentIndex + 1];
                images[currentIndex + 1] = temp;
                setItems(images);
                setCurrentIndex(currentIndex + 1);
            }
        }, [items, currentIndex])

        const removeImage = useCallback(() => {
            if ( items.length <= 0) {
                message.info('不能删除最后一张图片')
                return;
            }
            let images = [...items];
            images.splice(currentIndex, 1);
            setItems(images);
            if (currentIndex >= images.length) {
                setCurrentIndex(currentIndex - 1);
            }            
        }, [items, currentIndex])

        const onDrop = useCallback((files: File[], pics?: string[]) => {
            let data: ImageData[] = files.map((file, index) => {
                let item = {
                    src: pics ? pics[index] : '',
                    file: file.name,
                    alt: getFileName(file.name),
                    key: `${Math.random()}`
                }
                if (uploadFile) {
                    uploadFile(item, file);
                }
                return item;
            });
            let images = [...items, ...data];
            setItems(images);
        }, [items, uploadFile]);

        const onRef = (ref: any) => {
            optionsForm = ref;
        }
        const itemRender = (page: number, type: string, originalElement: any) => {
            if (type === 'page' && page <= items.length) {
                let index = page - 1;
                return <img className="index-image" src={items[index].src} alt={items[index].alt} />
            }
            if (type === 'prev') {
                return <LeftOutlined />
            }
            if (type === 'next') {
                return <RightOutlined />
            }
            return originalElement;
        }

        const tools: ToolbarProps = {
            groups: [
                {
                    name: 'hover-tools',
                    buttons: [
                        actionLabelButton('move-left', '前移', () => {
                            movePrev();
                        }),
                        actionLabelButton('move-right', '后移', () => {
                            moveNext();
                        }),
                        actionLabelButton('remove', '删除', () => {
                            removeImage();
                        }),
                    ]
                }
            ]
        }

        return (
            <Modal className="image-card-modal modal"
                    visible={visible}
                    width={700}
                    title="设置"
                    okText="确定"
                    cancelText={'取消'}
                    onCancel={onCancel}
                    onOk={onOk}
            >
                <WrapOptionsForm onRef={onRef} value={option}/>
                <Divider />
                <Row>
                    <Col span={4} className="index-image-nav-label ant-form-item-label"><label>图片</label></Col>
                    <Col span={12}><Pagination className="index-image-nav" current={currentIndex + 1} itemRender={itemRender} onChange={onImageChange} showLessItems pageSize={1} total={items.length} /></Col>
                </Row>
                
                <Form form={form} className="small-form" layout="horizontal" labelCol={{span: 4}} style={{marginTop: 3}} >
                    <Form.Item label="图片地址" name='url'>
                        <Input />
                    </Form.Item>
                    <Form.Item label="名称" name="alt">
                        <Input placeholder="请输入图片名称" />
                    </Form.Item>
                    <Form.Item label="链接地址" name="href">
                        <Input placeholder="请输入链接地址" />
                    </Form.Item>
                </Form>
                <Row>
                    <Col offset={4} span={8}>
                        <Toolbar className="toolbar" {...tools} />
                    </Col>
                    <Col offset={8}>
                        <ImageUploader
                                withPreview={false}
                                withIcon={false}
                                singleImage
                                buttonText='上传图片'
                                onChange={onDrop}
                                label=''
                                imgExtension={props.imgExtension}
                                maxFileSize={props.maxFileSize}
                        />
                    </Col>
                </Row>
            </Modal>
        );
    }
);

const getFileName = (file: string) => {
    let index = file.lastIndexOf('.');
    if (index !== -1) {
        return file.substring(0, index);
    }
    return file;
}
type ImageData = {
    src: string,
    alt?: string,
    href?: string,
    file?: string,
    key?: string,
}
export const ImageOption = {
    /**
     * 支持的图片扩展名，如['.jpg', '.gif', '.png', '.jpeg']
     */
    Extensions: 'image.exts',
    /**
     * 单个文件最大限制(字节)，默认1M(即1048576字节)
     */
    MaxFileSize: 'image.maxFileSize'
}

function imageReducer(state: any, action: any) {
    let items = state.images.map((item: any) => {
        return {...item}
    });
    let uploadedMap = {...state.uploadedMap};

    switch (action.type) {
        case 'add':
            return {
                images: action.images,
                uploadedMap: {...state.uploadedMap}
            };
        case 'uploaded':
            let item = items.find((item: ImageData) => action.key === item.key);
            if (item) {
                item.src = action.url;
            }
            else {
                uploadedMap[action.key] = action.url;
            }
            return {
                images: items, 
                uploadedMap: uploadedMap
            };
        case 'set':
            items = action.images.map((item: ImageData) => {
                item = {...item}
                if (item.key && uploadedMap[item.key]) {
                    item.src = uploadedMap[item.key];
                }
                return item;
            })
            return {
                images: items, 
                uploadedMap: uploadedMap
            };
        default:
            throw new Error();
    }
}

const ImageCard = (props: any) => {
    const {attributes, children, element} = props;
    const editor = useEditor()
    const readOnly = useReadOnly()
    const selected = useSelected()
    const [ selection, setSelection ] = useState<any>();
    const [ showSetting, setShowSetting ] = useState(false);
    const [ viewerVisible, setViewerVisible ] = useState(false);
    const [ option, setOption ] = useState(element.option || {});
    const [ imageState, dispatch ] = useReducer(imageReducer, {images: [], uploadedMap: {}});

    let height = element.height ? element.height : 200;
    const editorProps: EditorProps = editor.editorProps;
    const imgExtension = editorProps?.option?.[ImageOption.Extensions] || ['.jpg', '.gif', '.png', '.jpeg'];
    const maxFileSize = editorProps?.option?.[ImageOption.MaxFileSize] || 1048576;
    const uploadLabel = `图片大小：< ${(maxFileSize / 1048576).toFixed(1)}M, 可以上传多张，支持类型: ${imgExtension.join('、')}`;
    
    const tools: ToolbarProps = {
        groups: [
            {
                name: 'hover-tools',
                buttons: [
                    actionButton('setting', '设置', () => {
                        setSelection(editor.selection)
                        if (element.data.length === 0) {
                            message.info('请先上传图片')
                        }
                        else {
                            setShowSetting(true);
                        }
                    }),
                    actionButton('search', '查看', () => {
                        if (element.data.length === 0) {
                            message.info('请先上传图片')
                        }
                        else {
                            setViewerVisible(true);
                        }
                    }),
                    actionButton('delete', '删除', () => {
                        let path = ReactEditor.findPath(editor, element);
                        Transforms.removeNodes(editor, {at: path});
                    }),
                ]
            }
        ]
    }

    const uploadFile = useCallback((data: ImageData, file: File) => {
        const editorProps: EditorProps = editor.editorProps;
        if (!editorProps?.onUpload) {
            return;
        }
        editorProps.onUpload({file, type: ElementType.Image}).then(result => {
            dispatch({type: 'uploaded', key: data.key, url: result.url});            
        })
        .catch(err => {
            message.error(`${file.name}文件上传失败: ${err}`);
        })
    }, [editor.editorProps]);

    const onDrop = useCallback((files: File[], pics?: string[]) => {
        let data: ImageData[] = files.map((file, index) => {
            return {
                src: pics ? pics[index] : '',
                file: file.name,
                alt: getFileName(file.name),
                key: `${Math.random()}`
            }
        });
        let path = ReactEditor.findPath(editor, element);
        Transforms.setNodes(editor, { data }, { at: path })  

        dispatch({type: 'add', images: data})

        data.forEach((item, index) => {
            uploadFile(item, files[index]);
        })
        
    }, [editor, element, uploadFile]);

    const swiperItems = useMemo(() => {
        return element.data.map((item: ImageData) => {
            if (readOnly) {
                return {
                    image: item.src,
                    title: item.alt,
                    link: item.href
                }
            }
            else {
                //在编辑模式下不生成链接，防止误点击
                return {
                    image: item.src,
                    title: item.alt
                }
            }
        })
    }, [element, readOnly])

    const swiperOptions = useMemo(() => {
        let op: any = {
            loop: true
        }
        if (option.options) {
            if (option.options.indexOf('autoplay') >= 0) {
                op.autoplay = {
                    delay: 2500,
                    disableOnInteraction: true,
                }
            }
            if (option.options.indexOf('navigation') >= 0) {
                op.navigation = true
            }
        }
        switch (option.effect) {
            case 'fade':
                op.effect = 'fade';
                break;
            case 'cube':
                op.effect = 'cube';
                op.grabCursor = true;
                op.cubeEffect = {
                    shadow: true,
                    slideShadows: true,
                    shadowOffset: 20,
                    shadowScale: 0.94,
                }
                break;
            case 'coverflow':
                op.effect = 'coverflow';
                op.grabCursor = true;
                op.centeredSlides = true;
                op.slidesPerView = 'auto';
                op.coverflowEffect = {
                    rotate: 50,
                    stretch: 0,
                    depth: 100,
                    modifier: 1,
                    slideShadows : true,
                }
                break;
            case 'flip':
                op.effect = 'flip';
                op.grabCursor= true;
                break;
        }
        return op;
    }, [option]);

    const onOK = useCallback((items: ImageData[], option: any) => {
        let path = ReactEditor.findPath(editor, element);
        dispatch({type: 'set', images: items});

        items = items.map((item) => {
            if (item.key) {
                let url: string = imageState.uploadedMap[item.key];
                if (url) {
                    item.src = url;
                }
            }            
            return item;
        })

        Transforms.setNodes(editor, { data: items, option }, { at: path })  

        setOption(option);

        setShowSetting(false)
        editor.selection = selection;
    }, [editor, element, selection, imageState]);

    const onCancel = () => {
        setShowSetting(false)
        editor.selection = selection;
    }

    const onResizeStop = useCallback((size: {width: number, height: number}) => {
        let path = ReactEditor.findPath(editor, element);
        Transforms.setNodes(editor, {height: size.height}, {at: path});
    }, [editor, element]);
    
    const inner = (
        <div className="image-container" contentEditable={false}>
            { element.data.length === 1 ?
                <img className="image" style={{cursor: 'default'}} alt={''} src={element.data[0].src} /> 
              :
                <ReactSwiper options={swiperOptions} pagination navigation={swiperOptions.navigation} items={swiperItems} />
            }
            <Viewer
                visible={viewerVisible} noNavbar={true} 
                onClose={() => { setViewerVisible(false); } }
                images={element.data}
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
        <div {...attributes} className="image-card">
            <Card tools={tools} texts={children} selected={selected}
                onResizeStop={onResizeStop} height={height}
            >
                { 
                    (!element.data || element.data.length === 0) ? 
                        <ImageUploader
                                withPreview
                                withIcon
                                buttonText='上传图片'
                                onChange={onDrop}
                                label={uploadLabel}
                                imgExtension={imgExtension}
                                maxFileSize={maxFileSize}
                        />
                    :
                        inner
                }
            </Card>
            <WrapSettingForm uploadFile={uploadFile}
                visible={showSetting} items={[...imageState.images]} option={option} onOk={onOK} onCancel={onCancel} 
                imgExtension={imgExtension} maxFileSize={maxFileSize}
            />
        </div>
   )
}