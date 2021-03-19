import React from 'react';
import './App.scss';
import './lib/themes/antd-theme.less';

import { renderRoutes } from 'react-router-config'
import zhCN from 'antd/es/locale/zh_CN';
import { ConfigProvider } from 'antd';
import 'moment/locale/zh-cn';

const App = (props: any) => {
    console.log(props)
  return (
    <>
      <ConfigProvider locale={zhCN}>
        {renderRoutes(props.route.routes)}
      </ConfigProvider>
    </>
  );
}

export default App;
