import React from 'react';
import {posts} from './posts';
import {routes} from './routes.js';

export class List extends React.Component {
    render() {
        console.log(posts);
        return <div className="posts">
            {posts.map(post =>
                <div className="post">
                    <h1>{post.title}</h1>
                    {post.parts.map(part =>
                        <div className="part">
                            <div className="part-link" onClick={()=>routes.post.goto({id: part.id})}>{part.title}</div>
                        </div>)}
                </div>)}
        </div>
    }
}

