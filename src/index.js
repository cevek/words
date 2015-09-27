import React from 'react';
import {Router, Route} from './Router.js';
import {App} from './App.js';
import {List} from './List.js';
import {routes} from './routes.js';


React.render(<Router routes={[
                        {path: routes.index, handler: List},
                        {path: routes.post, handler: App, resolve: App.resolve},
                    ]}/>, document.body);

