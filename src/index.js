import React from 'react';
import {Router, Route} from './Router.js';
import {App} from './App.js';
import {List} from './List.js';
import {routes} from './routes.js';
import {account} from './Account.js';
import {TOKEN} from './Token.js';
import {WordProcessor} from './WordProcessor.js';


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

function pp(origin, user) {
    const words = new WordProcessor(origin, user);
    words.print();
}
window.pp = pp;
pp('She gives the man some money', 'She gives to the man some money');
pp('-This is Alissa, - the man says to him wife', '-This is Alissa, - the man says her wife');
pp('Suddenly the woman shouts at Alissa', 'Suddenly a woman shouts at the Alissa');
//pp('-You aren’t going to read here,- she here,’ she shouts', '-You aren’t going to read here,- she here,’ she shouts');
pp('The woman shouts at her every day', 'The woman shouts at her every day');
pp('She cries every night.', 'She cries every day.');
