import * as React from 'react';
import {routes} from './../routes';
import {Component} from "./../libs/Component";
import {postStorage} from "./../models/PostStore";

export class List extends Component<any> {
    render() {
        return <div className="posts">
            {postStorage.getItems().filter(post => post.isTop).map(post =>
                <div key={post.id} className="post">
                    <h1>{post.title}</h1>
                    {post.parts.map(part =>
                        <div key={part.id} className="part">
                            <div className="part-link" onClick={()=>routes.post.goto({id: part.id})}>{part.title}</div>
                        </div>)}
                </div>)}
        </div>
    }
}

