export function DeleteSaga(dispatcher, state, data_delete) {
  this.state = state;
  this.dispatcher = dispatcher;

  this.delete_selected = () => {
    const links = this.get_links_to_delete();

    if ((links !== null) && (links.length > 0)) {
      const send_data = links.map(x => {
        return { id: x.child.get_node().elem_id, parent_id: x.parent.get_node().elem_id }
      });
      const promise = data_delete(send_data);
      
      // choose parent of 1st element and find out whether or not it is inside the deletion list -> true : advance further to root (root itselfs cannot be deleted)
      let root_parent = links[0].parent;
      while (send_data.some(x => x.id === root_parent.get_node().elem_id))
      {
        root_parent = root_parent.locate_parent();
      }

      return this.observe_deletion(root_parent.get_downward_path(), promise);
    } else {
      const deferred = $.Deferred();
      deferred.resolve(null);
      return deferred.promise();
    }
  };

  this.get_links_to_delete  = () => {
    if (!this.state.can_browse()) {
      return null;
    }

    const selected = this.state.locate_all_selected();
    return selected.map( x => {
      const parent = x.locate_parent();
      return {
        child: x,
        parent: parent
      };
    }).filter(x => x.parent !== null);

  };

  this.observe_deletion = (path_to_parent, deletion_promise) => {
    this.state.operation = "delete";
    this.dispatcher.tree_changed();

    const deferred = $.Deferred();

    deletion_promise
      .then(() => {
        this.state.operation = "browse";
        // select and zoom to parent
        deferred.resolve(path_to_parent);
      });

    return deferred.promise();
  };
}

