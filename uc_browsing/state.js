export function VisibleState() {
  this.set = (tree, selected, expanded) => {
    this.operation = "browse"; // others: paste, create, rename
    this.is_available = true;
    this.tree = tree;
    this.selected = selected;
    this.expanded = expanded;
    this.creating = null;
    this.renaming = null;
  };
  this.reset = () => {
    this.operation = "browse";
    this.is_available = false;
    this.tree = null;
    this.selected = null;
    this.expanded = null;
    this.creating = null;
    this.renaming = null;
  };

  this.reset();

  this.begin_creating = parent_gui_id => this.creating = parent_gui_id;
  this.end_creating = () => this.creating = null;
  this.begin_renaming = gui_id => this.renaming = gui_id;
  this.end_renaming = () => this.renaming = null;

  this.can_browse = () => this.is_available && this.operation === "browse";

  this.is_valid = () => (!this.creating || !this.renaming) &&
    (!this.is_available || (typeof this.tree === "object" && typeof this.selected === "object" && typeof this.expanded === "object")) &&
    (this.operation !== "browse" || (this.creating === null && this.renaming === null)) &&
    (typeof this.is_available === "boolean");

  this.is_single_selection = () => this.selected !== null && this.selected.length === 1;
  this.locate_single_selected = () => this.tree.locate(this.selected[0]);
}
