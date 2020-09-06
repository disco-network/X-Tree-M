import { DeleteSaga } from "../uc_browsing/delete.js";
import { Tree, Graph } from "../uc_browsing_tree.js";
import { VisibleState } from "../uc_browsing/state.js";

const assert = chai.assert;

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
