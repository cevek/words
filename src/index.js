import React from 'react';
import {Router, Route} from './Router.js';
import {App} from './App.js';
import {List} from './List.js';
import {routes} from './routes.js';
import {account} from './account.js';


window.log = function () {
    console.log.apply(console, arguments);
};

class Main extends React.Component {
    login() {
        account.login().then(()=> {
            //todo
            location.reload();
            //this.forceUpdate();
        });
    }

    render() {
        return <div>
            {account.isAuthorized
                ? <div></div>
                : <button onClick={()=>this.login()}>Login</button>
            }
            <Router routes={[
                        {path: routes.index, handler: List},
                        {path: routes.post, handler: App, resolve: App.resolve}
                    ]}/>
        </div>
    }
}

account.fetch().then(()=> {
    React.render(<Main/>, document.getElementById('app'));
});
