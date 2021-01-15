import { arrays_equal } from "../global_functions.js";

export function Path(ids_on_path) {
  this.ids_on_path = ids_on_path;

  if (this.ids_on_path.length === 0) {
    throw new Error("Path must not be empty");
  }

  this.get_downward_ids = () => this.ids_on_path;
  this.get_upper_id = () => ids_on_path[0];
  this.get_lower_id = () => ids_on_path.slice(-1)[0];
  this.is_in_cache = (cache) => this.ids_on_path.every(id => cache.has(id));

  this.equals_to = (other) => arrays_equal(this.ids_on_path, other.ids_on_path);

}

export function Selection() {
  this.selected_paths = [];

  this.has = (path) => this.selected_paths.find((new Path(path)).equals_to) !== undefined;
  this.add = (path) => this.has(path) || this.selected_paths.push(new Path(path));
  this.remove = (path) => this.selected_paths = this.selected_paths.filter(not((new Path(path)).equals_to));
  this.toggle = (path) => this.has(path) ? this.remove(path) : this.add(path);
  this.clear = () => this.selected_paths = [];

  this.get_selected_paths = () => this.selected_paths.map(p => p);
  this.size = () => this.selected_paths.length;
}

function not(predicate) { return x => !predicate(x) };

export function VisibleState() {
  this.reset = () => {
    this.operation = "browse";
    this.is_available = false;
    this.tree = null;
    this.selected = new Selection();
    this.expanded = new Selection();
    this.creating = null;
    this.renaming = null;
  };

  this.reset();

  this.begin_creating = parent_gui_id => this.creating = parent_gui_id;
  this.end_creating = () => this.creating = null;
  this.begin_renaming = gui_id => this.renaming = gui_id;
  this.end_renaming = () => this.renaming = null;

  this.can_browse = () => this.is_available && this.operation === "browse";

  this.is_single_selection = () => this.selected !== null && this.selected.size() === 1;
  this.locate_all_selected = () => this.selected.get_selected_paths().map(path => this.tree.locate_using_downward_path(path.get_downward_ids()));
  this.locate_single_selected = () => this.locate_all_selected()[0];
  this.locate_last_selected = () => this.locate_all_selected().slice(-1)[0];  
}
