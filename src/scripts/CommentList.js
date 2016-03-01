import {createStore} from 'redux';
import {diff} from 'virtual-dom';
import {patch} from 'virtual-dom';
import {create} from 'virtual-dom';
import {h} from 'virtual-dom'; // jshint ignore:line
import ElementBase from 'basic-element-base/src/ElementBase';

class CommentList extends ElementBase {

  static get defaultState() {
    return {
      commentList: [],
      deepCopy() {
        let copy = Object.assign({}, this);
        copy.commentList = this.commentList.slice();
        return copy;
      }
    };
  }

  static reducer(state, action) {
    if (action == null || action.type == null) {
      return state;
    }
    if (state == null) {
      state = CommentList.defaultState;
    }

    switch (action.type) {
      case 'ADD_COMMENTS_FROM_ATTRIBUTES':
        // We build the list of comments from the attributes that hosting code set on this component.
        // When we get an attribute change notification, we can throw out the previous state and build
        // new state entirely from the component's attributes.
        let newState = CommentList.defaultState.deepCopy();
        action.comments.map((comment) => {
          newState.commentList.push(comment);
        });
        return newState;

      default:
        return state;
    }
  }

  createdCallback() {
    // Initialize the component state and its Redux store.
    // Build the initial DOM root node and prepare for future virtual-dom patches.
    this.store = createStore(CommentList.reducer);
    this.state = CommentList.defaultState;
    this.tree = this.render(this.state);
    this.rootNode = create(this.tree);

    this.store.subscribe(this.storeListener.bind(this));

    this.appendChild(this.rootNode);

    if (super.createdCallback) {
      super.createdCallback();
    }
  }

  storeListener() {
    let newTree = this.render(this.store.getState());
    let patches = diff(this.tree, newTree);
    this.rootNode = patch(this.rootNode, patches);
    this.tree = newTree;
  }

  set commentData(json) {
    let arrayComments = JSON.parse(json);
    this.store.dispatch({
      type: 'ADD_COMMENTS_FROM_ATTRIBUTES',
      comments: arrayComments
    });
  }
  get commentData() {
    return this.store.getState().commentList;
  }

  render(state) {
    /* jshint ignore:start */
    let commentNodes = state.commentList.map((comment) => {
      return (
        <rwc-comment attributes={{author: comment.author, key: comment.key}}>
          {comment.commentText}
        </rwc-comment>
      );
    });

    return (
      <div id="commentList">
        {commentNodes}
      </div>
    );
    /* jshint ignore:end */
  }
}

document.registerElement('rwc-comment-list', CommentList);
export default CommentList;
