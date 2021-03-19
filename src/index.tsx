import React from 'react';
import ReactDOM from 'react-dom';
import './lib/themes/index.scss';
import './lib/index.ts'

import { HashRouter } from 'react-router-dom'
import { renderRoutes } from 'react-router-config'
import routes from './router'
import * as serviceWorker from './serviceWorker';

ReactDOM.render(
    <HashRouter>
      {renderRoutes(routes)}
    </HashRouter>,
    document.getElementById("root")
);
//ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
