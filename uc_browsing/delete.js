export function DeleteSaga(dispatcher, state, data_delete) {
  this.state = state;
  this.dispatcher = dispatcher;

  this.delete_selected = () => {
    if (!this.state.can_browse() || !this.state.is_single_selection()) {
      return;
    }

    const selected = this.state.locate_single_selected();
    const parent = selected.locate_parent();

    if (parent === null) {
      return;
    }

    this.state.operation = "delete";
    this.dispatcher.tree_changed();

    data_delete([{ id: selected.get_node().elem_id, parent_id: parent.get_node().elem_id }], () => {
      this.state.operation = "browse";
      this.dispatcher.select_and_zoom_to(parent.get_node().gui_id);
    });
  };
}
