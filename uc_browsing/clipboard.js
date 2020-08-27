export function ClipboardSaga(dispatcher, state, data_copy_by_reference, data_cut) {
  this.action_in_clipboard = null;
  this.state = state;
  this.dispatcher = dispatcher;

  this.copy_by_reference = () => {
    if (!this.state.can_browse()) {
      return;
    }

    const selected_items = state.selected.map(this.to_elem_id);
    this.action_in_clipboard = () => {
      if (!this.state.is_single_selection() || !this.state.can_browse()) {
        return;
      }

      const target = this.state.locate_single_selected();

      this.state.operation = "paste";
      this.dispatcher.tree_changed();

      data_copy_by_reference(selected_items, target.get_node().elem_id, () => {
        this.state.operation = "browse"; // is this right?
        dispatcher.select_and_zoom_to(target.get_node().gui_id);
      });
    };
  };

  this.cut = () => {
    if (!this.state.can_browse()) {
      return;
    }

    const clipped = state.selected
      .map((gui_id) => this.tree.locate(gui_id))
      .map((pos) => ({ source: pos.locate_parent().get_node().elem_id, target: pos.get_node().elem_id }))
      .filter((link) => link.source !== null);

    this.action_in_clipboard = () => {
      if (!this.state.is_single_selection() || !this.state.can_browse()) {
        return;
      }

      this.state.operation = "paste";
      this.dispatcher.tree_changed();

      const target = this.state.locate_single_selected();
      data_cut(clipped, target.get_node().elem_id, () => {
        this.action_in_clipboard = null;
        this.state.operation = "browse"; // is this right?
        dispatcher.select_and_zoom_to(target.get_node().gui_id);
      });
    };
  };

  this.paste = () => {
    this.action_in_clipboard();
  };

  this.to_elem_id = (gui_id) => {
    return this.state.tree.locate(gui_id).get_node().elem_id;
  };
}
