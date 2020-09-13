export function ClipboardSaga(dispatcher, state, data_copy_by_reference, data_cut) {
  this.action_in_clipboard = null;
  this.state = state;
  this.dispatcher = dispatcher;

  this.copy_by_reference = () => {
    if (!this.state.can_browse()) {
      return;
    }

    const selected_items = state.selected.get_selected_paths().map(path => path.get_lower_id());
    this.action_in_clipboard = () => {
      if (!this.state.is_single_selection() || !this.state.can_browse()) {
        return;
      }

      const target = this.state.locate_single_selected();
      const target_path = target.get_downward_path();

      this.state.operation = "paste";
      this.dispatcher.tree_changed();

      data_copy_by_reference(selected_items, target.get_node().elem_id, () => {
        this.state.operation = "browse";
        dispatcher.select_and_zoom(target_path);
      });
    };
  };

  this.cut = () => {
    if (!this.state.can_browse()) {
      return;
    }

    // TODO: ensure that parent exists
    const clipped = state.locate_all_selected()
      .map(pos => ({ parent: pos.locate_parent().get_node().elem_id, child: pos.get_node().elem_id }))
      .filter((link) => link.source !== null);

    this.action_in_clipboard = () => {
      if (!this.state.is_single_selection() || !this.state.can_browse()) {
        return;
      }

      this.state.operation = "paste";
      this.dispatcher.tree_changed();

      const target = this.state.locate_single_selected();
      const target_path = target.get_downward_path();

      data_cut(clipped, target.get_node().elem_id, () => {
        this.action_in_clipboard = null;
        this.state.operation = "browse";
        dispatcher.select_and_zoom(target_path);
      });
    };
  };

  this.paste = () => {
    this.action_in_clipboard();
  };
}

