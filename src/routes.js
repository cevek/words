import {Route} from './Router.js';

export const routes = {
    index: new Route('/'),
    post: new Route('/post/:id')
};
