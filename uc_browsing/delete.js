export function DeleteSaga(dispatcher, state, data_delete) {
  this.state = state;
  this.dispatcher = dispatcher;

  this.delete_selected = () => {
    const link = this.get_link_to_delete();

    if (link !== null) {
      const id = link.child.get_node().elem_id;
      const parent_id = link.parent.get_node().elem_id;
      const promise = data_delete([{id: id, parent_id: parent_id}]);

      return this.observe_deletion(link.parent.get_downward_path(), promise);
    } else {
      const deferred = $.Deferred();
      deferred.resolve(null);
      return deferred.promise();
    }
  };

  this.get_link_to_delete = () => {
    if (!this.state.can_browse() || !this.state.is_single_selection()) {
      return null;
    }

    const selected = this.state.locate_single_selected();
    const parent = selected.locate_parent();

    if (parent === null) {
      return null;
    }

    return {
      child: selected,
      parent: parent
    };
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

