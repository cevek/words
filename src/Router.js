import React from 'react';
import classNames from 'classnames';

var scrollData = {};
var activeUrl;
var exclMark = false;
var html5History = false; //typeof history.pushState == 'function' ? true : false;
var activeRouter = null;

var stackComponent = [];
var resolving = false;

export function go(url, isBack, replaceCurrent) {
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


var allRouters = [];

export let stack = [];
//todo
export let routePublisher = null; //new Observable();


export function goBack(defaultUrl) {
    if (resolving) {
        return Promise.resolve();
    }
    //console.log("Router stack", stack);
    stack.pop();
    var url = stack.pop();

    if (url) {
        return go(url, true);
    }
    else {
        return go(defaultUrl, true);
    }
}

export class Router extends React.Component {
    activeRoute;
    activeComponent;
    activeProps;
    activeResolve;
    routes = [];
    emptyRoute;
    saveScroll = false;

    constructor(props) {
        super(props);
        activeRouter = this;
        allRouters.push(this);
    }

    hideMenu() {
        document.body.classList.remove('js-menu-opened');
    }

    changeUrl(isBack, replaceCurrent) {
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

        this.changeRoute(isBack);

        //debugger;
        var promise;
        if (this.activeResolve) {
            promise = this.activeResolve(this.activeProps);
        }
        else {
            promise = Promise.resolve();
        }
        promise.then(data=> {
            this.activeProps.resolved = data;
            var pos = stackComponent.length - (isBack ? 0 : 0);
            stackComponent.splice(pos, 0, {
                component: this.activeComponent,
                props: this.activeProps,
                url: activeUrl,
                isBack: isBack
            });

            this.forceUpdate();

            routePublisher && routePublisher.update({
                route: this.activeRoute,
                component: this.activeComponent,
                props: this.activeProps
            });
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


        this.activeComponent = this.emptyRoute;
        this.activeProps = {};
        for (var i = 0; i < this.routes.length; i++) {
            var {route, resolve, handler} = this.routes[i];
            var params = route.check(url);
            if (params) {
                this.activeRoute = route;
                this.activeComponent = handler;
                this.activeResolve = resolve;
                this.activeProps = params;
            }
        }
    }

    prepareRoutes(children) {
        //console.log("prepareRoutes", children);
        this.routes = [];
        for (var i = 0; i < children.length; i++) {
            var handler = children[i].handler;
            var path = children[i].path;
            var resolve = children[i].resolve;
            var route = path;
            if (typeof path == 'string') {
                if (path === '*') {
                    this.emptyRoute = handler;
                    return;
                }
                else {
                    route = new Route(path);
                }
            }
            this.routes.push({route: route, resolve: resolve, handler: handler});
        }
    }

    componentWillReceiveProps(newProps) {
        this.prepareRoutes(newProps.routes);
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
        this.prepareRoutes(this.props.routes);
        this.changeUrl();
    }

    componentDidUpdate() {
        //setTimeout(()=> {
        //console.log("Restore scroll", document.body.scrollHeight, scrollData[activeUrl] || 0);
        window.scrollTo(0, scrollData[activeUrl] || 0);
        this.saveScroll = true;
        //});
    }

    onTransitionEnd(cmp, i) {
        //stackComponent = [cmp];
        //resolving = false;
        stackComponent.splice(0, i);
        setTimeout(()=> {
            this.forceUpdate();
        });
    }


    render() {
        return <div {...this.props} className="router">
            {stackComponent.map((cmp, i) =>
                <Page onTransitionEnd={()=>this.onTransitionEnd(cmp, i)}
                      key={cmp.url}
                      isFirst={i == 0}
                      isBack={cmp.isBack}
                      component={cmp.component}
                      props={cmp.props}/>)
            }
        </div>;
    }
}

class Page extends React.Component {
    componentDidMount() {
        var root = React.findDOMNode(this.refs.root);

        // todo:
        // Reset scroll for 'stick-header' state
        //document.querySelector('.content-wrapper').scrollTop = 0;

        root.clientHeight;
        root.classList.remove('loading');

        /*
         if (!this.props.isFirst) {
         root.classList.add('next');
         if (this.props.isBack) {
         root.classList.add('back');
         }
         //root.classList.add('loading');
         root.clientHeight;
         root.classList.remove('next');
         root.classList.remove('back');

         //root.classList.remove('animation');
         }
         */
        if (this.props.isFirst) {
            resolving = false;
        }
        else {
            var hitted = false;
            var callback = ()=> {
                //root.classList.remove('loading');
                //console.log("Hitted");
                if (!hitted) {
                    this.props.onTransitionEnd();
                    hitted = true;
                }
            };
            /*
             root.addEventListener('transitionend', callback);
             root.addEventListener('webkitTransitionEnd', callback);
             root.addEventListener('mozTransitionEnd', callback);
             root.addEventListener('oTransitionEnd', callback);
             root.addEventListener('msTransitionEnd', callback);
             setTimeout(callback, 1000);
             */
            callback();
        }
    }

    render() {
        var Cmp = this.props.component;
        return Cmp ?
            <div ref="root" key={this.props.key} className={classNames('page', {'loading': !this.props.isFirst})}>
                <Cmp {...this.props.props}/>
            </div> : null
    }
}

export class Route {
    regexp;
    names;
    url;

    constructor(url) {
        url = '/' + url.replace(/(^\/+|\/+$)/g, '');
        url = url === '/' ? url : url + '/';
        this.url = url;
        var v;
        var reg = /:([^\/]+)/g;
        var names = [];
        while (v = reg.exec(url))
            names.push(v[1]);
        this.names = names;
        this.regexp = new RegExp('^' + url.replace(/(:([^\/]+))/g, '([^\/]+)') + '?$');
    }

    check(url) {
        var m;
        if (m = this.regexp.exec(url)) {
            var params = {};
            for (var j = 0; j < this.names.length; j++) {
                params[this.names[j]] = m[j + 1];
            }
            return params;
        }
        return null;
    }

    toUrl(params) {
        var url = this.url;
        for (var key in params) {
            url = url.replace(new RegExp(':' + key + '(/|$)'), params[key] + '$1');
        }
        return url;
    }

    goto(params, replaceCurrent, e) {
        if (e) {
            e.preventDefault();
        }
        return go(this.toUrl(params), null, replaceCurrent);
    }

}

