const { override, fixBabelImports, addLessLoader } = require('customize-cra');
 
module.exports = override(
  fixBabelImports('import', {
    libraryName: 'antd',
    libraryDirectory: 'es',
    // style: true, # 这里不注释掉就无法使用less修改主题，这里的功能是样式按需加载
  }),
  addLessLoader({
    javascriptEnabled: true,
    // modifyVars: { '@primary-color': '#1DA57A' },
  }),
  
  //修改默认配置，使发布地址支持相对路径
  (config) => {
    config.output.publicPath = './';
    return config;
  }
);