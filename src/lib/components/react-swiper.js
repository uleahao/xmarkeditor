/* eslint-disable jsx-a11y/alt-text */
import React, { useEffect, useRef } from 'react';
import Swiper from 'swiper';
import 'swiper/css/swiper.css';

const ReactSwiper = (props) => {
    const { items, className, pagination, navigation } = props;
    const swiperRef = useRef(null);

    useEffect(() => {
        let swiper = null;
        if (swiperRef.current) {
            let swiper = swiperRef.current.swiper;
            if (swiper) {
                swiper.destroy();
            }
            let options = {...props.options};
            if (props.pagination && !options.pagination) {
                options.pagination = {el: '.swiper-pagination', dynamicBullets: true}
            }
            if (props.navigation && !options.navigation) {
                options.navigation = {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                }
            }
            swiper = new Swiper(swiperRef.current, options);
        }
        
        return () => {
            if (swiper) {
                swiper.destroy();
            }
        }
    }, [props])
  
    return (
        <div className={`swiper-container ${className}`} ref={swiperRef}>
            <div className="swiper-wrapper">
            {
              items && items.map((item, index) => {
                const {image, link, title} = item;
                return (<div className="slider-item swiper-slide" key={index}>
                  <div className="slide-content">
                    {link ? 
                        <a href={link}>
                            <img className="swiper-img" src={image} alt={title}/>
                        </a>
                    : 
                        <img className="swiper-img" src={image} alt={title}/>
                    }
                  </div>
                </div>);
              })
            }
            </div>
            {pagination && <div className="swiper-pagination"></div>}
            {navigation && 
                <>
                <div className="swiper-button-prev"></div>
                <div className="swiper-button-next"></div> 
                </>
            }
        </div>
    );
}

ReactSwiper.defaultProps = {
    className: '',
    items: [],
    pagination: true,
    navigation: false,
    options: {}
}

export default ReactSwiper;