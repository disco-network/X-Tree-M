export function CreateSaga(dispatcher, state, data_create) {
  this.state = state;
  this.dispatcher = dispatcher;
  this.data_create = data_create;

  this.begin = () => {
    if (!this.state.can_browse() || !this.state.is_single_selection()) {
      return;
    }

    this.dispatcher.expand_children();

    const selected = this.state.locate_single_selected();

    this.state.creating = selected.get_gui_id();
    this.state.operation = "create_input";
    this.dispatcher.tree_changed();
  };

  this.apply = (name) => {
    if (
      this.state.creating === null ||
      this.state.operation !== "create_input"
    ) {
      return;
    }

    const creation_parent = this.state.tree.locate(this.state.creating);
    const creation_parent_path = creation_parent.get_downward_path();
    const creation_parent_id = creation_parent.get_node().elem_id;

    this.state.operation = "create";
    this.state.creating = null;
    this.dispatcher.tree_changed();

    this.data_create(creation_parent_id, name, () => {
      this.state.operation = "browse";
      this.dispatcher.select_and_zoom(creation_parent_path);
    });
  };
}
