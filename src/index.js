import React from 'react';
import {Router, Route} from './Router.js';
import {App} from './App.js';
import {List} from './List.js';
import {routes} from './routes.js';
import {account} from './Account.js';


window.log = function () {
    console.log.apply(console, arguments);
};

class Main extends React.Component {
    login() {
        account.login().then(()=> {
            this.forceUpdate();
        });
    }

    render() {
        return <div>
            <button onClick={()=>this.forceUpdate()}>Update</button>
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
