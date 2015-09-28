import React from 'react';
import {Router, Route} from './Router.js';
import {App} from './App.js';
import {List} from './List.js';
import {routes} from './routes.js';
import {vk} from './vk.js';
import {config} from './config.js';




window.log = function () {
    console.log.apply(console, arguments);
};

if (!localStorage.userId){
    localStorage.userId = Math.random().toString(33).substr(2, 20);
}


vk.getAuth().then(user=> {
    config.useAuth = true;
    config.user = user;
    localStorage.userId = user.userId;
}, ()=> {
    config.user.userId = localStorage.userId;
}).then(()=> {
    React.render(<div>
        {
            config.useAuth
                ? <div></div>
                : <button onClick={()=>vk.login().then(user=>{
                    config.useAuth = true;
                    config.user = user;
                    localStorage.userId = user.userId;
                })}>Login</button>
        }
        <Router routes={[
                        {path: routes.index, handler: List},
                        {path: routes.post, handler: App, resolve: App.resolve},
                    ]}/>

    </div>, document.getElementById('app'));
});
