declare module 'react-swiper';

export declare type Item = {
    image: string,
    title?: string,
    link?: string
}
export declare type ReactSwiperProps = {
    className?: string,
    items: Item[],
    pagination: boolean,
    navigation: boolean,
    options: any
};
declare const ReactSwiper: {
    (props: ReactSwiperProps): JSX.Element;
    defaultProps: {
        className?: string,
        items: Item[],
        pagination: boolean,
        navigation: boolean,
        options: any
    };
};

export default ReactSwiper;