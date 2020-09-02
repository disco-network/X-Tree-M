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

    this.state.creating = selected.get_node().gui_id;
    this.state.operation = "create_input";
    this.dispatcher.tree_changed();
  };

  this.apply = (name) => {
    if (this.state.creating === null || this.state.operation !== "create_input") {
      return;
    };

    const created = this.state.tree.locate(this.state.creating);
    const created_gui_id = created.get_node().gui_id;
    const created_id = created.get_node().elem_id;

    this.state.operation = "create";
    this.dispatcher.tree_changed();

    this.data_create(created_id, name, () => {
      this.state.operation = "browse";
      this.dispatcher.select_and_zoom_to(created_gui_id);
    });
  };
}

