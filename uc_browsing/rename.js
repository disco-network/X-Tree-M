export function RenameSaga(dispatcher, state, data_rename) {
  this.state = state;
  this.dispatcher = dispatcher;
  this.data_rename = data_rename;

  this.begin = () => {
    if (!this.state.can_browse() || !this.state.is_single_selection()) {
      return;
    }

    const selected = this.state.locate_single_selected();

    this.state.renaming = selected.get_gui_id();
    this.state.operation = "rename_input";
//    this.dispatcher.text_focus = 1;
    this.dispatcher.tree_changed();
  };

  this.skip = () => {
    if (this.state.renaming === null || this.state.operation !== "rename_input") {
      return;
    };
    this.state.renaming = null;
    this.state.operation = "browse";
    this.dispatcher.tree_changed();
  };


  this.apply = (name) => {
    if (this.state.renaming === null || this.state.operation !== "rename_input") {
      return;
    };

    const renamed = this.state.tree.locate(this.state.renaming);
    const renamed_path = renamed.get_downward_path();
    const renamed_id = renamed.get_node().elem_id;

    this.state.operation = "rename";
    this.state.renaming = null;
    this.dispatcher.tree_changed();

    this.data_rename(renamed_id, name, () => {
      this.state.operation = "browse";
      this.dispatcher.select_and_zoom(renamed_path);
    });
  };
}

