import {Route} from './libs/Router';

export const routes = {
    index: new Route('/'),
    post: new Route<{id: string}>('/post/:id')
};
