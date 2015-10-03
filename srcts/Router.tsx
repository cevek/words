import * as React from 'react';
import {Component} from './Component';

var scrollData:{[page: string]: number} = {};
var activeUrl:string;
var exclMark = false;
var html5History = false; //typeof history.pushState == 'function' ? true : false;
var activeRouter:Router;

var resolving = false;

export function go(url:string, isBack = false, replaceCurrent = false) {
    if (resolving) {
        return Promise.resolve();
    }

    if (html5History) {
        history.pushState(null, null, url);
    }
    else {
        url = url.split('#').pop();
        if (url.indexOf('http:') === 0) {
            url = '/';
        }
        location.hash = (exclMark ? '!' : '') + url;
    }
    if (!isBack) {
        scrollData[location.href] = 0;
    }
    return activeRouter.changeUrl(isBack, replaceCurrent);
}

export let stack:string[] = [];

export function goBack(defaultUrl:string) {
    if (resolving) {
        return Promise.resolve();
    }
    stack.pop();
    var url = stack.pop();

    if (url) {
        return go(url, true);
    }
    else {
        return go(defaultUrl, true);
    }
}

export interface RouterPage<T, R> {
    route:Route<T>;
    handler: new (props:{params: T, resolved: R}) => Component<{params: T, resolved: R}>;
    resolver?: (params:T)=>Promise<R>;
    params?:T;
    resolved?:R;
    url?:string;
}


export class Router extends Component<{pages: RouterPage<any, any>[]}> {
    activePage:RouterPage<any, any>;
    routes = this.props.pages;
    emptyPage:RouterPage<any, any>;

    saveScroll = false;

    constructor(props:any) {
        super(props);
        activeRouter = this;
    }

    hideMenu() {
        document.body.classList.remove('js-menu-opened');
    }

    changeUrl(isBack = false, replaceCurrent = false) {
        var currentUrl = location.href;
        if (activeUrl == currentUrl) {
            this.hideMenu();
            return Promise.resolve();
        }
        resolving = true;

        this.saveScroll = false;
        activeUrl = currentUrl;
        if (replaceCurrent) {
            stack.pop();
        }
        stack.push(activeUrl);
        //console.log("changeUrl", stack);

        this.changeRoute();

        //debugger;
        if (this.activePage.resolver){
            var promise = this.activePage.resolver(this.activePage.params);
        }
        else {
            promise = Promise.resolve(null);
        }
        promise.then(data=> {
            this.activePage.resolved = data;
            this.activePage.url = activeUrl;
            this.forceUpdate();
            resolving = false;
        }, (callback)=> {
            resolving = false;
            if (typeof callback == 'function') {
                callback();
            }
        });
        return promise;
    }

    changeRoute() {
        var url = '';
        if (html5History) {
            url = location.pathname;
        }
        else {
            url = location.hash.substr(1);
            if (exclMark && url[0] == '!') {
                url = url.substring(1);
            }
        }

        this.activePage = this.emptyPage;
        for (var i = 0; i < this.routes.length; i++) {
            var routeItem = this.routes[i];
            var params = routeItem.route.check(url);
            if (params) {
                this.activePage = routeItem;
                this.activePage.params = params;
            }
        }
    }

    componentWillReceiveProps() {
        this.changeRoute();
    }

    componentDidMount() {
        //console.log("componentDidMount");
        window.addEventListener(html5History ? 'popstate' : 'hashchange', ()=> {
            this.changeUrl();
        });
        window.addEventListener('scroll', ()=> {
            if (this.saveScroll) {
                scrollData[activeUrl] = window.scrollY;
            }
        });
        this.changeUrl();
    }

    componentDidUpdate() {
        window.scrollTo(0, scrollData[activeUrl] || 0);
        this.saveScroll = true;
    }

    render() {
        return <div className="router">
            {this.activePage
                ? React.createElement(this.activePage.handler, {resolved: this.activePage.resolved, params: this.activePage.params})
                : null}
        </div>;
    }
}

export class Route<P> {
    regexp:RegExp;
    names:string[];
    url:string;

    constructor(url:string) {
        url = '/' + url.replace(/(^\/+|\/+$)/g, '');
        url = url === '/' ? url : url + '/';
        this.url = url;
        var v:string[];
        var reg = /:([^\/]+)/g;
        var names:string[] = [];
        while (v = reg.exec(url))
            names.push(v[1]);
        this.names = names;
        this.regexp = new RegExp('^' + url.replace(/(:([^\/]+))/g, '([^\/]+)') + '?$');
    }

    check(url:string) {
        var m:string[];
        if (m = this.regexp.exec(url)) {
            var params:{[index: string]: string} = {};
            for (var j = 0; j < this.names.length; j++) {
                params[this.names[j]] = m[j + 1];
            }
            return params;
        }
        return null;
    }

    toUrl(params:P) {
        var url = this.url;
        for (var key in params) {
            url = url.replace(new RegExp(':' + key + '(/|$)'), (params as any)[key] + '$1');
        }
        return url;
    }

    goto(params:P, replaceCurrent = false, e?:MouseEvent) {
        if (e) {
            e.preventDefault();
        }
        return go(this.toUrl(params), null, replaceCurrent);
    }
}

