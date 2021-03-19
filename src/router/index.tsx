import App from '../App'
import DocEditor from '../pages/doc-editor'
import DocViewer from '../pages/doc-viewer'

export default [
    {
        component: App,
        routes: [
            {
                path: '/editor',
                exact: true,
                component: DocEditor,
            },
            {
                path: '/viewer',
                exact: true,
                component: DocViewer,
            }
        ]
    }
]