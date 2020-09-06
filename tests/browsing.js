import { DeleteSaga } from "../uc_browsing/delete.js";
import { Tree, Graph } from "../uc_browsing_tree.js";
import { VisibleState } from "../uc_browsing/state.js";

import { lib_data_client } from "../lib_data_client.js";
import { uc_browsing_model } from "../uc_browsing_model.js";

const assert = chai.assert;

describe("The Use Case Browsing Model", () => {
  it("loads the tree on startup", (done) => {
    const assertion_runner = gen_assertion_runner();

    // arrange 
    const db = create_sample_database();

    const dispatcher = {
      tree_changed: () => {
        assertion_runner.next();
      }
    };

    const model = new uc_browsing_model(dispatcher, db);

    // act
    model.select_and_zoom(["ID_Grandparent", "ID_Parent", "ID_Pivot"]);

    // assert
    function* gen_assertion_runner() {
      // loading
      yield;
      while(!model.get_state().can_browse()) {
        const state = model.get_state();
        assert.equal(state.operation, "browse", "While loading, the operation attribute is 'browse'");
        assert.isFalse(state.is_available, "While loading, the tree is not available");
        yield;
      }

      // After loading, the tree is shown
      const state = model.get_state();
      assert.isTrue(state.can_browse());

      const pivot_pos = state.tree.locate_pivot();
      assert.equal(pivot_pos.get_node().elem_id, "ID_Pivot", "After loading, the pivot of the tree has ID 'ID_Pivot'");

      done();
    }
  });
});

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
  const graph = new Graph([
    create_sample_node("Grandparent", null),
    create_sample_node("Parent", "Grandparent"),
    create_sample_node("Pivot", "Parent"),
    create_sample_node("Child1", "Pivot"),
    create_sample_node("Child2", "Pivot")
  ]);

  return new Tree("GUI_Pivot", ["GUI_Parent", "GUI_Grandparent"], graph);
}

function create_sample_node(label, parent_label) {
  return {
    gui_id: "GUI_" + label,
    elem_id: "ID_" + label,
    parent_gui_id: parent_label !== null ? "GUI_" + parent_label : null,
    name: label,
    description: label + "'s description"
    // still missing: eval, isMultiPar, is_deleted, type
  };
}
