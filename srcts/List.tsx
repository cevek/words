import * as React from 'react';
import {postStorage} from './posts/posts';
import {routes} from './routes';
import {Component} from "./Component";

export class List extends Component<any> {
    render() {
        return <div className="posts">
            {postStorage.posts.filter(post => post.isTop).map(post =>
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

