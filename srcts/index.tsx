import * as React from 'react';
import {Component} from './Component';
import {Router, Route, RouterPage} from './Router';
import {App} from './App';
import {List} from './List';
import {routes} from './routes';
import {account} from './Account';
import {TOKEN} from './Token';
import {WordProcessor} from './WordProcessor';

class Main extends Component<{}> {
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
                : <button onClick={()=>this.login()}>Login</button>}

            <Router pages={[
                        {route: routes.index, handler: List},
                        {route: routes.post, handler: App, resolver: App.resolver}
                    ]}/>
        </div>
    }
}

account.fetch().then(()=> {
    React.render(<Main/>, document.getElementById('app'));
});

function pp(origin:string, user:string) {
    const words = new WordProcessor(origin, user);
    words.print();
}
(window as any).pp = pp;
/*
pp('She gives the man some money', 'She gives to the man some money');
pp('-This is Alissa, - the man says to him wife', '-This is Alissa, - the man says her wife');
pp('Suddenly the woman shouts at Alissa', 'Suddenly a woman shouts at the Alissa');
//pp('-You aren’t going to read here,- she here,’ she shouts', '-You aren’t going to read here,- she here,’ she shouts');
pp('The woman shouts at her every day', 'The woman shouts at her every day');
pp('She cries every night.', 'She cries every day.');
*/

//pp('One day, the thin man says to Alissa, ','  One day, the thin man says to Alissa:')
//pp('The next morning, the thin man takes Alissa into the house', 'Next morning a thin man takes Alissa in the house');
pp('The next morning, the thin man takes Alissa into house', 'TAKES ALISSA IN HOUSE NEXT MORNING A THIN MAN');