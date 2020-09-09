import { DeleteSaga } from "../uc_browsing/delete.js";
import { Tree, Graph } from "../uc_browsing_tree.js";
import { Path, VisibleState } from "../uc_browsing/state.js";

import { lib_data_client } from "../lib_data_client.js";
import { uc_browsing_model } from "../uc_browsing_model.js";

const assert = chai.assert;

/**
 * Integration tests of uc_browsing_model
 *
 * Basic idea: do something and track state changes.
 * The assertion_runner is a generator function that contains the assertions:
 * "yield;" indicates that we wait until the state has changed.
 **/
describe("The Use Case Browsing Model", () => {

  it("loads the tree on startup", (done) => {
    const runner = new AssertionRunner();

    runner.arrange();
    runner.act_and_assert(gen_assertion_runner);

    function* gen_assertion_runner({model}) {
      // Act
      // load tree
      yield* runner.run(() => model.select_and_zoom(["ID_Grandparent", "ID_Parent", "ID_Pivot"]));
      yield* runner.await_state_change();
      // wait until loaded
      while(!model.get_state().can_browse()) {
        const state = model.get_state();
        assert.equal(state.operation, "browse", "While loading, the operation attribute is 'browse'");
        assert.isFalse(state.is_available, "While loading, the tree is not available");
        yield* runner.await_state_change();
      }

      // Assert
      // The tree is available
      const state = model.get_state();
      assert.isTrue(state.can_browse());
      // The pivot and selection are correct
      const pivot_pos = state.tree.locate_pivot();
      assert.equal(pivot_pos.get_node().elem_id, "ID_Pivot", "After loading, the pivot of the tree has ID 'ID_Pivot'");
      assert.isTrue(state.is_single_selection(), "After loading, exactly one node is selected");
      assert.equal(state.locate_single_selected().get_node().elem_id, "ID_Pivot", "After loading, the pivot is selected");

      done();
    }
  });

  it("moves the selection down", (done) => {

    const runner = new AssertionRunner();

    runner.arrange();
    runner.act_and_assert(gen_assertion_runner);

    function* gen_assertion_runner({model}) {
      // Act
      // load tree
      yield* runner.run(() => model.select_and_zoom(["ID_Grandparent", "ID_Parent", "ID_Pivot"]));
      yield* runner.await_state_change();
      yield* wait(() => !model.get_state().can_browse());
      // move selection down
      yield* runner.run(() => model.move_selection_down());
      yield* runner.await_state_change();

      // Assert
      const state = model.get_state();
      assert.isTrue(state.is_single_selection(), "After moving down, exactly one child is selected");
      assert.equal(state.locate_single_selected().get_node().elem_id, "ID_Child1", "After moving down, the first child is selected");

      done();
    }
  });

  it("creates a new element", (done) => {
    const runner = new AssertionRunner();

    runner.arrange();
    runner.act_and_assert(function* ({model}) {
      const state = model.get_state();

      // Act #1
      // load tree
      yield* runner.run(() => model.select_and_zoom(["ID_Grandparent", "ID_Parent", "ID_Pivot"]));
      yield* runner.await_state_change();
      yield* wait(() => !state.can_browse());
      // begin creating
      yield* runner.run(() => model.begin_creating());
      yield* runner.await_state_change();
      
      // Assert #1
      assert.isFalse(state.can_browse(), "Cannot browse when input prompt is shown");
      assert.isNotNull(state.creating);
      assert.equal(state.creating, state.tree.locate_pivot().get_gui_id());

      // Act #2
      yield* runner.run(() => model.apply_name_input("New Node's Name"));
      yield* runner.await_state_change();
      yield* wait(() => !state.can_browse());

      // Assert #2
      assert.deepEqual(state.tree.locate_pivot().get_downward_path(), ["ID_Grandparent", "ID_Parent", "ID_Pivot"]);
      assert.isTrue(state.is_single_selection());
      assert.isTrue(state.selected.has(new Path(["ID_Grandparent", "ID_Parent", "ID_Pivot", "ID_Child1"])));
      assert.isNotNull(state.tree.locate_using_downward_path(["ID_Grandparent", "ID_Parent", "ID_Pivot", "ID_Child1"]));

      done();
    });
  });
});

function AssertionRunner() {

  this.arrange = () => {
    this.db = create_sample_database();

    this.dispatcher = {
      tree_changed: () => {
        this.assertion_runner.next("tree_changed");
      }
    };

    this.model = new uc_browsing_model(this.dispatcher, this.db);
  };

  this.act_and_assert = (generator) => {
    this.assertion_runner = generator({
      model: this.model
    });

    this.assertion_runner.next();
  };

  this.await_state_change = function* () {
    assert.equal(yield, "tree_changed");
  };
  
  this.run = function* (fn) {
    let did_tree_change = false;
    setTimeout(() => {
      this.assertion_runner.next("begin_function");
      fn();
      this.assertion_runner.next("end_function");
      if (did_tree_change) {
        this.assertion_runner.next("tree_changed");
      }
    });

    assert.equal(yield, "begin_function");
    let yield_value = yield;
    while (yield_value === "tree_changed") {
      did_tree_change = true;
      yield_value = yield;
    }
    assert.equal(yield_value, "end_function");
  };
}

function* wait(predicate) {
  while (predicate()) {
    yield;
  }
}

describe("DeleteSaga", () => {
  it("indicates loading, then finishes", (done) => {
    const generator = gen();

    // arrange
    const tree = create_sample_tree();
    const state = new VisibleState();
    state.set(tree, ["GUI_Child1"], {});

    const dispatcher = {
      tree_changed: () => {
        generator.next();
      }
    };

    const data_delete = (links) => {
      const deferred = $.Deferred();
      setTimeout(() => deferred.resolve());
      return deferred.promise();
    };

    const delete_saga = new DeleteSaga(dispatcher, state, data_delete);

    // act
    generator.next();
    delete_saga.delete_selected().then(() => done());

    // assert
    function* gen() {

      // At the beginning, we are browsing.
      assert.isTrue(state.can_browse());

      // Wait for a state change.
      yield;

      while (state.operation === "delete") {
        // Wait for a state change.
        yield;
      }

      assert.equal(state.operation === "browse");
      //assert.deepEqual(state.selected, ["GUI_Child1"]);
      //assert.isNotNull(state.tree.locate("GUI_Child1"));
      //assert.isNull(state.tree.locate("GUI_Child2"));
    };
  });
});


function create_sample_database() {
  const nodes = new Map();

  add_node("Grandparent", "");
  add_node("Parent", "");
  add_node("Pivot", "");
  add_node("Child1", "");
  add_node("Child2", "");

  add_link("Grandparent", "Parent");
  add_link("Parent", "Pivot");
  add_link("Pivot", "Child1");
  add_link("Pivot", "Child2");

  const db = new lib_data_client();
  db.set_nodes(nodes);

  return db;
  
  function add_node(label, description) {
    nodes.set("ID_" + label, {
      elem_id: "ID_" + label,
      name: label,
      description: description,
      eval: [],
      child_links: []
    });
  }

  function add_link(parent_label, child_label) {
    nodes.get("ID_" + parent_label).child_links.push({
      is_deleted: 0,
      child_id: "ID_" + child_label
    });
  }
}

function create_sample_tree() {
  const gui_nodes = new Map();
  const nodes = new Map();
  add_node("Grandparent", null);
  add_node("Parent", "Grandparent");
  add_node("Pivot", "Parent");
  add_node("Child1", "Pivot");
  add_node("Child2", "Pivot");
  const graph = new Graph(gui_nodes, nodes);

  return new Tree("GUI_Pivot", ["GUI_Parent", "GUI_Grandparent"], graph);

  function add_node(label, parent_label) {
    const node = create_sample_node(label);
    const gui_node = {
      gui_id: "GUI_" + label,
      parent_gui_id: parent_label !== null ? "GUI_" + parent_label : null,
      id: node.elem_id
    };

    gui_nodes.set(gui_node.gui_id, gui_node);
    nodes.set(node.elem_id, node);
  }
}

function create_sample_node(label) {
  return {
    elem_id: "ID_" + label,
    name: label,
    description: label + "'s description"
    // still missing: eval, isMultiPar, is_deleted, type
  };
}
