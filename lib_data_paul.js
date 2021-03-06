﻿import { report_duration, f_append_to_pad } from "./global_functions.js";
import { Graph, Tree, LinearGraphBuilder, TreeGraphBuilder } from "./uc_browsing_tree.js";
import {
  c_LANG_UC_BROWSING_PANEL2_EVAL_CATS
} from "./uc_browsing_lang.js";
import { uc_browsing_change_permission } from "./uc_browsing_setup.js";
import { c_LANG_LIB_TREE_ELEMTYPE } from "./lib_tree_lang.js";


// Bridge for Paul's approach to make a MySQL database accessible through PHP (alternative to local XML based
// approach)
//
// Usecases : 
//	- Import data from database
//	- Navigate through tree
//	- Track changes (GUI + local content storage + database)
//
// Example :
//   http://datokrat.sirius.uberspace.de/xtreem/getNodeInfos.php?ids[]=1
//        Object { 
//          .name: "Was n�tzt effektiv dem Weltfrieden?", 
//          .content: "Eine sehr schwierige Frage, die geeignete Werkzeuge braucht, um konstruktiv diskutiert zu werden.", 
//          .author: {�}, 
//          .type: "general", 
//          .children: (1) [�], 
//          .parents: [] }
//   http://datokrat.sirius.uberspace.de/xtreem/create_item.php?parentnodeid=1&authorid=1&name=Titel
//   http://datokrat.sirius.uberspace.de/xtreem/changeItem.php?id=1&name=NeuerName&content=NeuerContent


export const c_EMPTY_EVAL_STRUCT = [];
for (var i=0; i < c_LANG_UC_BROWSING_PANEL2_EVAL_CATS.length-1; i++)
{
  const item = {};
  item.avg = 0.0;
  item.num = 0;
  c_EMPTY_EVAL_STRUCT.push(item);
}  

// Class 'lib_data_paul'
export function lib_data_paul(data_src_path, data_src_params, defaultParentStorage, global_setup)
{
  // import params
  this.data_src_path = data_src_path;
  this.data_src_params = data_src_params;
  this.defaultParentStorage = defaultParentStorage;
  this.data_root_id = data_src_params.root_item;
  this.global_setup = global_setup;   // don't change any of these setups since they're just copied by reference !!!
  
  // tree functions
  this.write_tree = lib_data_paul_write_tree.bind(this);
  this.req_tree = lib_data_paul_req_tree.bind(this);
  this.req_tree_only = lib_data_paul_req_tree_only.bind(this);
  this.req_tree_items = lib_data_paul_req_tree_items.bind(this);
  this.get_tree = lib_data_paul_get_tree.bind(this);  

  // item functions
  this.get_multi_parents = lib_data_paul_get_multi_parents.bind(this);
  this.req_all_parents = lib_data_paul_req_all_parents.bind(this);
  this.get_all_parents = lib_data_paul_get_all_parents.bind(this);
  this.item_exists = lib_data_paul_item_exists.bind(this);
  this.create_tree_item = lib_data_paul_create_tree_item.bind(this);
  this.delete_tree_item = lib_data_paul_delete_tree_item.bind(this);
  this.copy_items = lib_data_paul_copy_items.bind(this);
  this.clone_items = lib_data_paul_clone_items.bind(this);
  this.move_items = lib_data_paul_move_items.bind(this);

  // field functions
  this.create_tree_item_field = lib_data_paul_create_tree_item_field.bind(this);
  this.change_tree_item_field = lib_data_paul_change_tree_item_field.bind(this);
  this.get_tree_item_field = lib_data_paul_get_tree_item_field.bind(this);
                    
                    
  // object variables
  this.next_id = 0;               // it's necessary to know which IDs can be created for new items
  this.root_id = "1";

                                  // variables
  this.req_elem_ids   = [];
  this.is_deleted_arr = [];
  this.parent_gui_id_arr = [ null ];
  this.parent_elem_id_arr = [ null ];
  this.req_tree_state = "rts_idle";  
  this.del_item_state = "di_idle";
  this.rts_ret_struct = {}; // The cached tree structure from the last successfull req_tree execution
  this.curr_item_parents = [];
  this.move_item_state = "mis_idle";
  this.eval_cat_num = c_LANG_UC_BROWSING_PANEL2_EVAL_CATS.length-1;

}





//################################################################################################
//### Tree functions
//################################################################################################


function f_IntArr2StrArr(IntArr)
{
  var StrArr = [];
  if (IntArr != undefined)
  {
    if (IntArr.length > 0)
    {
      for (var i=0; i<IntArr.length; i++)
        StrArr[i] = IntArr[i].toString();
    }
  }
  return StrArr;
}

function get_type_no(typeInternalStr)
{
  for (var i=0; i<c_LANG_LIB_TREE_ELEMTYPE.length; i++)
  {
    if (typeInternalStr == c_LANG_LIB_TREE_ELEMTYPE[i][0])
      return i - 1;
  }
  return -1;
}


function sort(tree_nodes, sibling_start, sibling_len)
{
  for(var i=sibling_start; i<(sibling_start+sibling_len); i++)          // loop over all sibling elements
  {
    var curr_winner_idx = i;
    var my_type_no = get_type_no(tree_nodes[i].type);
    var my_name = tree_nodes[i].name;
    for(var j=i+1; j<(sibling_start+sibling_len); j++)      // loop over all siblings after current elem ...
    {  
      var cmp_type_no = get_type_no(tree_nodes[j].type); 
                                            // ... to find the elem which fits current sort position best     
      if ((my_type_no>cmp_type_no) || ((my_type_no == cmp_type_no) && (my_name > tree_nodes[j].name)))
      {
        my_type_no = cmp_type_no;
        my_name = tree_nodes[j].name;
        curr_winner_idx = j;
      }
    }
    if (curr_winner_idx != i)               // exchange items if necessary
    {
      var hlp = jQuery.extend(true, {}, tree_nodes[i]);
      tree_nodes[i] = jQuery.extend(true, {}, tree_nodes[curr_winner_idx]);
      tree_nodes[curr_winner_idx] = jQuery.extend(true, {}, hlp);
    } 
  }
}



function lib_data_paul_write_tree(iparams)
{
  alert("Paul : Write Tree not yet implemented");
} 

/*
 * Returns a $.Deferred providing a GraphBuilder object for the corresponding subtrees of the requests.
 * The return value of the builders is the gui_id of their respective root.
 */
function lib_data_paul_req_tree_items(requests, childlevels) {
  if (requests.length === 0) {
    report_duration("req_tree_only", this.debug_start_time);
    return $.Deferred(promise => promise.resolve([]));
  }

  var url = this.data_src_path + "get?childlevels=" + childlevels + "&" + requests.map(function(req) { return "ids[]=" + req.elem_id }).join("&");
  if (uc_browsing_change_permission === 1) {
    url += "&showDeleted=1";
  }

  function process_response_rec(request, response, depth) {
    if (depth < 0) {
      throw new Error("invalid depth");
    }

    const raw_node = response[request.elem_id];
    const node_data = {
      elem_id: request.elem_id,
      name: raw_node.name,
      is_deleted: request.is_deleted,
      isMultiPar: false,
      description: raw_node.content,
      type: get_xtype("1", raw_node.type),
      eval: c_EMPTY_EVAL_STRUCT
    };

    var children = raw_node.children.map(function (child_id) {
          return {
            elem_id: child_id.toString(),
            is_deleted: 0
          };
    });
    children = children.concat((raw_node.del_children || []).map(function(child_id) {
      return {
        elem_id: child_id.toString(),
        is_deleted: 1
      }
    }));

    const subtree_builders = depth > 0
      ? children.map(child_request => process_response_rec(child_request, response, depth - 1))
      : [];

    return new TreeGraphBuilder(node_data, subtree_builders, (node_gui_id, child_gui_ids) => node_gui_id);
  }

  var self = this;
  const start_time = new Date();
  return $.Deferred(deferred => $.get(url)
    .done(function(data) {
      const request_end_time = new Date();
      const requested_graph_builders = requests.map(function(request, i) {
        return process_response_rec(request, data.nodes, childlevels);
      });
      deferred.resolve(requested_graph_builders);
    })
    .fail(function() {
      deferred.reject();
    })
  ).promise();
}

/*
 * Request a subtree.
 * Parameters:
 *  - path: array of elem_id's (as strings), starting from the "locked" root item down to the selected item
 *  - cb_success: the callback that is invoked in case of success
 */
function lib_data_paul_req_tree_only(iparams) {
  f_append_to_pad('div_panel4_pad','req_tree_only');        

  this.debug_start_time = new Date();

  if (iparams.path == undefined || iparams.path.length === 0) {
    f_append_to_pad('div_panel4_pad', 'Parameter "path" is malformed - leaving!');
    return;
  }
  
  const path = iparams.path;
  const cb_success = iparams.cb_success;
  
  // path to selected item (explorer path)

  var self = this;
  const downward_explorer_path = path.slice(0, -1);
  const upper_explorer_path = downward_explorer_path.slice(0, -1);
  const pivot_parent_id = downward_explorer_path.slice(-1)[0];
  const pivot_id = path.slice(-1)[0];
  const tree_origin_id = pivot_parent_id !== undefined ? pivot_parent_id : pivot_id;
  const depth = pivot_parent_id !== undefined ? 10 : 9;

  const explorer_path_requests = upper_explorer_path.map(function (id, i) {
    return {
      elem_id: id,
      is_deleted: 0
    };
  });
  var tree_request = {
    elem_id: tree_origin_id,
    is_deleted: 0
  };

  const upper_promise = self.req_tree_items(explorer_path_requests, 0);
  const lower_promise = self.req_tree_items([tree_request], depth);

  $.when(upper_promise, lower_promise)
    .then(function (upper_builders, lower_builders) {
      const builder = new LinearGraphBuilder(upper_builders.concat(lower_builders), gui_id_list => gui_id_list);
      const result = builder.build();
      const graph = result.graph;

      var explorer_path;
      var pivot_parent_gui_id;
      if (pivot_parent_id !== undefined) {
        explorer_path = result.annotation.slice().reverse();
        pivot_parent_gui_id = explorer_path[0];
      } else {
        explorer_path = result.annotation.slice(0, -1).reverse();
        pivot_parent_gui_id = null; // The pivot has no parent
      }
      const pivot_siblings = graph.get_gui_children_of(pivot_parent_gui_id);
      const pivot_gui_id = pivot_siblings
        .find(gui_id => graph.get_node_by_gui_id(gui_id).elem_id === pivot_id);
  
      const tree = new Tree(
        pivot_gui_id,
        explorer_path,
        result.graph,
      );
      report_duration("req_tree_only", self.debug_start_time);
      cb_success(tree);
    })
    .fail(function () {
      alert("req_tree_only request failed");
    });
}

/*
 * Precondition: elemId is a non-empty array of IDs.
 */
function lib_data_paul_req_tree(iparams)   // iparams = {ids, depth}
{

  const {ids, depth} = iparams;
  const url = this.data_src_path + "get?childlevels=" + depth + "&" + ids.map(id => "ids[]=" + id).join("&");

  return $.Deferred(deferred => {
    $.get(url)
      .then(result => {
        deferred.resolve(Object.values(result.nodes).map(raw_node => ({
          elem_id: "" + raw_node.id,
          name: raw_node.name,
          description: raw_node.content,
          type: get_xtype("1", raw_node.type),
          eval: [],
          child_links: raw_node.children_included
            ? raw_node.children.map(child_id => ({ is_deleted: 0, child_id: child_id })) // TODO: deleted children
            : null
        })));
      })
      .fail(err => deferred.reject(err));
  }).promise();
}

function lib_data_paul_get_tree(iparams)
{
//  return JSON.parse("{\"fav\":[],\"ticker\":[],\"explorer_path\":[],\"tree_nodes\":[{\"parent_elem_id\":\"\",\"parent_gui_id\":\"\",\"elem_id\":\"1\",\"gui_id\":\"T0\",\"name\":\"aufWaren-/Personen-Austausch&rsaquo;\",\"type\":\"topic\",\"description\":\"\",\"eval\":[{\"avg\":0,\"num\":0},{\"avg\":0,\"num\":0},{\"avg\":0,\"num\":0}],\"isMultiPar\":false}]}");
  return this.rts_ret_struct;
}


function lib_data_paul_get_multi_parents(elem_id, my_parents)
{
  var parent_from_storage = this.defaultParentStorage.read(elem_id);
  if (parent_from_storage == undefined)
    return my_parents[0]; 
  else
    return parent_from_storage;   
}



// find out whether or not an item exists
function lib_data_paul_item_exists(itemId)
{
  alert("Paul : Item Exists not yet implemented");  
}
  
// create new tree item
function lib_data_paul_create_tree_item( iparams )  // iparams = {parent_elem_id, name, type, cb_success}
{

  // create local copy of params
  var iparams_cp = jQuery.extend(true, {}, iparams);   

  //  URL example : .../create?parentnodeid=1&name=blau&type=general&authorid=1
  var post_params = "parentnodeid=" + iparams_cp.parent_elem_id;
  post_params = post_params + "&" + "name=" + encodeURIComponent(iparams_cp.name);
  post_params = post_params + "&" + "type=" + iparams_cp.type;  // general";    
  post_params = post_params + "&" + "authorid=1";

  $.post(this.data_src_path+"create?"+post_params, { })
    .done(function(data) {
      const newId = data.id.toString();
      iparams_cp.cb_success(newId);
    }.bind(this))
}  
  
  
// delete item and all of its children
function lib_data_paul_delete_tree_item(iparams)          //  iparams = {links: {id, parent_id}, cb_success}
{  
  // create local copy of params
  var iparams_cp = jQuery.extend(true, {}, iparams);   

  //  old URL example : .../delete?id=10
  //  new URL example : .../deleteLink?id=5&parentid=1
  //  newer URL example: .../deleteLinks?ids[]=5&pids[]=1
  var args = iparams_cp.links.map(function (link) {
    return "ids[]=" + link.id + "&pids[]=" + link.parent_id;
  }).join("&");
  var url = this.data_src_path + "deleteLinks?" + args;
  
  $.get(url)
    .done(function(data) {
      iparams_cp.cb_success();
    });
}

 
// get Item's parent nodes
function lib_data_paul_req_all_parents(iparams)
{  
  alert("Paul : Req All Parents not yet implemented");
}  


// get Item's parent nodes
function lib_data_paul_get_all_parents(itemId)
{
  return this.curr_item_parents; 
}

  
// cut&paste operations (later : for copy by reference) 
function lib_data_paul_copy_items(iparams)
{  
  //  URL example : .../addLink?ids[]=[...1]&pids[]=[...1]&ids[]=[...2]&pids[]=[...2]&...
  var args = iparams.src_ids.map(function (copy_id) {
    return "ids[]=" + copy_id + "&pids[]=" + iparams.target_id;
  }).join("&");
  var url = this.data_src_path + "addLinks?" + args;
  
  $.get(url)
    .done(function(data) {
      iparams.cb_success();
    });
}


function lib_data_paul_clone_items(iparams)
{  
  // create local copy of params
  var iparams_cp = jQuery.extend(true, {}, iparams);   

  //  URL example : .../cloneNode?id=[Kind-ID]&targetparentid=[ID, unter der der Knoten eingef�gt werden sollte]
  if ((iparams_cp.src_elem[0].elem_id != undefined) && (iparams_cp.dst_elem.elem_id != undefined))
  {
    var post_params = "id=" + iparams_cp.src_elem[0].elem_id;
    post_params = post_params + "&targetparentid=" + iparams_cp.dst_elem.elem_id;
    
    $.post(this.data_src_path+"cloneNode?"+post_params, { })
      .done(function(data) {
        this.req_tree({elemId:[iparams_cp.dst_elem.elem_id], lock_id:iparams_cp.lock_id, favIds:[], tickerIds:[], cb_fct_call:iparams_cp.cb_fctn_str, mode:"tree_only"});
      }.bind(this))
      .fail(function() 
      {
        f_append_to_pad('div_panel4_pad','clone_item failed');                                        
        this.req_elem_ids = [];                 
        this.req_tree_state = "rts_idle";  
      }
    );
  }
  else
  {
    alert("clone_items : Incomplete Parameters");
  }
}  


  
// cut&paste operations (later : for copy by reference) 
function lib_data_paul_move_items(iparams)  // iparams = {sources: [{parent, child}], target_id, cb_success}
{
  const post_params = iparams.sources
    .map((link) =>
      "ids[]=" + link.child + "&opids[]=" + link.parent + "&npids[]=" + iparams.target_id)
    .join("&");

  //  URL example : .../moveLinks?id=[Kind-ID]&oldparentid=[...]&newparentid=[...]
  
  $.post(this.data_src_path+"moveLinks?"+post_params, { })
    .done(function(data) 
    {
      iparams.cb_success();
    });
}


  // field functions

// create fields of tree item
function lib_data_paul_create_tree_item_field(itemId, fieldId, content)
{
  alert("Paul : Create Tree Item Field not yet implemented");    
}  
  

// change fields of tree item                             
function lib_data_paul_change_tree_item_field(iparams) //  iparams = {elem_id, field_id, content, cb_success}
{  
  // create local copy of params
  var iparams_cp = jQuery.extend(true, {}, iparams);   

  //  URL example : .../update?id=7&name=yellow
  if (iparams_cp.elem_id != undefined)
  {
    var post_params = "id=" + iparams_cp.elem_id + "&" + iparams_cp.field_id + "=" + encodeURIComponent(iparams_cp.content);
    
    $.post(this.data_src_path+"update?"+post_params, { }, null, "text")
      .done(function(data) {
        iparams_cp.cb_success();
      }.bind(this));
  }
  else
  {
    alert("Unknown Parameter elem_id");
  }
}


// get field content
function lib_data_paul_get_tree_item_field(itemId, fieldId)
{
  alert("Paul : Get Tree Item Field not yet implemented");    
}





function lib_data_disco_write_tree(iparams)
{
  alert("Write Tree not yet implemented");
}  


// auxiliary function of 'lib_data_disco_req_tree'
// works as ontology for the element types
function get_xtype(my_ref_type, my_post_type)
{
  // ... to Topic
  if ((my_ref_type == "1") || (my_post_type == "1"))  // ((my_ref_type == "Child") || (my_post_type == "Topic"))
    return c_LANG_LIB_TREE_ELEMTYPE[1][0];
  // ... to Fact
  if ((my_ref_type == "5") || (my_post_type == "5"))  // ((my_ref_type == "Evidence") || (my_post_type == "Information"))
    return c_LANG_LIB_TREE_ELEMTYPE[2][0];
  // ... to Pro-Arg
  if ((my_ref_type == "7"))                           // ((my_ref_type == "Agreement"))
    return c_LANG_LIB_TREE_ELEMTYPE[3][0];
  // ... to Contra-Arg
  if ((my_ref_type == "6") || (my_ref_type == "8"))   // ((my_ref_type == "Objection") || (my_ref_type == "Disagreement"))  
    return c_LANG_LIB_TREE_ELEMTYPE[4][0];
  // ... to Question
  if ((my_post_type == "3"))                          // ((my_post_type == "Question"))
    return c_LANG_LIB_TREE_ELEMTYPE[5][0];
  // ... to Problem 
  if ((my_post_type == "7"))                          // ((my_post_type == "Problem")) // (new)
    return c_LANG_LIB_TREE_ELEMTYPE[6][0];
  // ... to Idea
  if ((my_post_type == "4"))                          // ((my_post_type == "Proposal"))  
    return c_LANG_LIB_TREE_ELEMTYPE[7][0];
  // ... to Goal
  if ((my_post_type == "8"))                          // ((my_post_type == "Goal")) // (new)
    return c_LANG_LIB_TREE_ELEMTYPE[8][0];
//  // ... to Region (might be relevant later on)
  if ((my_post_type == "9"))                          // ((my_post_type == "Region")) // (new)
    return c_LANG_LIB_TREE_ELEMTYPE[9][0];
  // ... to Non-Typed
  return "Unknown";  
}





//################################################################################################
//### Item functions
//################################################################################################

function lib_data_disco_get_multi_parents(elem_id, my_parents)
{
  var parent_from_storage = this.default_parent_setup_obj.read(elem_id);
  if ((parent_from_storage == undefined) || (parent_from_storage == null))
    return [my_parents[0]]; 
  else
    return [parent_from_storage];   
}

// find out whether or not an item exists
function lib_data_disco_item_exists(itemId)
{
  var retval = true;
  discoContext.Posts.filter('it.Id == ' + itemId).toArray().then
  (
    function(response) 
    { 
      if (response.length == 0) 
        retval = false 
    }
  ).catch
  (
    function(response) 
    { 
      alert('Connection failed !'); 
    }
  );  
  
  return retVal;
}


function ontology_xtm2disco_post(xtm_type)
{
  switch (xtm_type)
  {
    case "topic"                        : return "1"; // "Topic";
    case "fact"                         : return "5"; // "Information";
    case "pro_arg"                      : return "2"; // "General";
    case "con_arg"                      : return "2"; // "General";
    case "question"                     : return "3"; // "Question";
    case "problem"                      : return "7"; // to be defined : "Problem";
    case "idea"                         : return "4"; // "Proposal";
    case "aim"                          : return "8"; // to be defined : "Goal";
    case "region"                       : return "9"; // to be defined : "Region";
    default                             : return "2"; // "General";
  }
}  

function ontology_xtm2disco_postref(xtm_type)
{
  switch (xtm_type)
  {
    case "topic"                        : return "1"; // "Child";
    case "fact"                         : return "5"; // "Evidence";
    case "pro_arg"                      : return "7"; // "Agreement";
    case "con_arg"                      : return "8"; // "Disagreement";
    case "question"                     : return "2"; // "General";
    case "problem"                      : return "2"; // "General";
    case "idea"                         : return "2"; // "General";
    case "aim"                          : return "2"; // "General";
    case "region"                       : return "2"; // "General";
    default                             : return "2"; // "General";    
  }
}  


// create new tree item
function lib_data_disco_create_tree_item( iparams )  // iparams = {parent_elem_id, name, type, lock_id, cb_fctn_str}
{
  var iparams_cp = jQuery.extend(true, {}, iparams);  
  
  var myContent = new Disco.Ontology.Content(); 
  var newId = undefined;
  myContent.Text = "";
  myContent.Title = iparams_cp.name;
  myContent.CultureId = "2";
  this.context.Content.add(myContent);                                    
  this.context.saveChanges().then
  (
    function(response)
    {
      var myPost = new Disco.Ontology.Post();
      myPost.PostTypeId = ontology_xtm2disco_post(iparams_cp.type);
      myPost.ContentId = myContent.Id;
      this.context.Posts.add(myPost);                                    
      this.context.saveChanges().then
      (
        function(response)
        {                     
          var myPostRef = new Disco.Ontology.PostReference();
          myPostRef.ReferrerId = myPost.Id;
          myPostRef.ReferreeId = iparams_cp.parent_elem_id;
          myPostRef.ReferenceTypeId = ontology_xtm2disco_postref(iparams_cp.type);
          this.context.PostReferences.add(myPostRef);                                    
          this.context.saveChanges().then
          (
            function(response)
            {
                                    // reload Tree
              this.req_tree({elemId:[iparams_cp.parent_elem_id], lock_id:iparams_cp.lock_id, favIds:[], tickerIds:[], cb_fct_call:iparams_cp.cb_fctn_str, mode:"tree_only"});
            }.bind(this)
          ).catch
          (
            function(response) 
            { 
              alert("Create PostRef failed !"); 
            }.bind(this)  
          );      
        }.bind(this)
      ).catch
      (
        function(response) 
        { 
          alert("Create Post failed !"); 
        }.bind(this)  
      );      
      
    }.bind(this)
  ).catch
  (
    function(response) 
    { 
      alert("Create Content failed !"); 
    }.bind(this)  
  );
}



// delete item and all of its children
function lib_data_disco_delete_tree_item(iparams)          //  iparams = {parentId, itemId, lock_id, cb_fctn_str}
{
  var iparams_cp = jQuery.extend(true, {}, iparams);  
                                    // check if last operation is already finished
  if (this.del_item_state == "di_idle")
  {
    // ########################################################################################
    var do_del_item = function() 
    {
      switch (this.del_item_state)
      {
        // ### Idle
        case "di_idle" :
        break;        
        // ### part 1 : erase link to parents
        case "di_cut_root_ref" :
                                    // get PostRefs to parent nodes for current target node
            this.context.PostReferences.filter('it.ReferrerId == '+iparams_cp.itemId[0]).toArray().then 
            (
              function(response) 
              {
                                    // find link to Default parent
                var i=0;
                while (i<response.length) 
                {
                  if (response[i].ReferreeId == iparams_cp.parentId)
                    break;                   
                  i++;
                }            
                                    // put current node into Processing FIFO
//                item_fifo[0] = {};
//                item_fifo[0].parentId = iparams_cp.parentId;
//                item_fifo[0].itemId = iparams_cp.itemId[0];
                                    // put PostRef to parent into Deletion FIFO
                item_parts2del[0] = {};
                item_parts2del[0].type = "PostRef";
                item_parts2del[0].id = response[i].Id;
                                    // prepare next step
                this.del_item_state = "di_del_item_parts"; 
                do_del_item.call(this);                           
              }.bind(this)
            ).catch
            (
              function(response) 
              { 
                this.del_item_state = "di_idle";                  
                alert('Get PostRef : Connection failed !'); 
              }.bind(this)
            );  
        break;    
        // ### part 2 : get info for current node
        case "di_get_info" :
            if (item_fifo.length > 0)
            {
              this.context.Posts.filter('it.Id == '+item_fifo[0].itemId).include('RefersTo').include('ReferredFrom').toArray().then
              (
                function(response) 
                {
                  item_parts2del = [];
                  var idx = 0;
                                    // current node is not linked to parents any more -> erase everything
                  if (response[0].RefersTo.length < 1)
                  {
                                    // traverse all child nodes
                    for (var k=0; k<response[0].ReferredFrom.length; k++)
                    {
                                    // put children into FIFO to check if they need to be erased, too
                      idx = item_fifo.length;
                      item_fifo[idx] = {};
                      item_fifo[idx].parentId = response[0].Id;
                      item_fifo[idx].itemId = response[0].ReferredFrom[k].ReferrerId;                       
                                    // put all child connections to erase list
                      idx = item_parts2del.length;
                      item_parts2del[idx] = {};                            
                      item_parts2del[idx].type = "PostRef";                
                      item_parts2del[idx].id = response[0].ReferredFrom[k].Id; 
                    }
                    // ################################################################################                    
                    // ### Current DISCO-Server doesn't support to delete Posts and Content Objects ###
                    // ################################################################################
                    // #                 // put post itself on erase list                             #
                    // # idx = item_parts2del.length;                                                 #
                    // # item_parts2del[idx] = {};                                                    #
                    // # item_parts2del[idx].type = "Post";                                           #
                    // # item_parts2del[idx].id = response[0].Id;                                     #
                    // #                 // put content on erase list                                 #
                    // # idx = item_parts2del.length;                                                 #
                    // # item_parts2del[idx] = {};                                                    #
                    // # item_parts2del[idx].type = "Content";                                        #
                    // # item_parts2del[idx].id = response[0].ContentId;                              #
                    // ################################################################################
                  }  
                                    // prepare next step
                  item_fifo.splice(0,1);                                    
                  this.del_item_state = "di_del_item_parts";                  
                  do_del_item.call(this);
                }.bind(this)
              ).catch
              (
                function(response) 
                { 
                  this.del_item_state = "di_idle";                  
                  alert('Get PostRef : Connection failed !'); 
                }.bind(this)
              );  
            }
            else
            {
              iparams_cp.itemId.splice(0,1); 
              if (iparams_cp.itemId.length > 0)
              {
                this.del_item_state = "di_cut_root_ref";
                do_del_item();
              }  
              else
              {
                this.del_item_state = "di_idle";         
                                      // reload tree after deletion
                this.req_tree({elemId:[iparams_cp.parentId], lock_id:iparams_cp.lock_id, favIds:[], tickerIds:[], cb_fct_call:iparams_cp.cb_fctn_str, mode:"tree_only"}); 
              }
            }
        break;
        // ### part 3 : deletion processing
        case "di_del_item_parts" :  
            if (item_parts2del.length > 0)
            {
              switch (item_parts2del[0].type)
              {
                case "Content" :      
                    this.context.Content.filter('it.Id == '+item_parts2del[0].id).toArray().then
                    (                                                                                                                    
                      function(response)                                                                                                 
                      {                                                                                                                  
                        this.context.Content.remove(response[0]);                                                                                             
                        this.context.saveChanges().then
                        (
                          function(response) 
                          {
                                      // erase first item in erasure list
                            item_parts2del.splice(0,1);                          
                                      // items left to erase ? -> continue
                            if (item_parts2del.length > 0)
                            {
                              this.del_item_state = "di_del_item_parts";                  
                            }
                                      // current item is finished -> any other nodes on Queue ?                          
                            else
                            {
                              this.del_item_state = "di_get_info";                    
                            }
                                      // next iteration
                            do_del_item.call(this);                          
                          }.bind(this)
                        ).catch
                        (
                          function(response) 
                          { 
                            this.del_item_state = "di_idle";
                            alert("Removing Content with Id : " + response[0].Id + " failed !"); 
                          }.bind(this)
                        );                
                      }.bind(this)
                    ).catch
                    (
                      function(response)                                                                                                 
                      {
                        this.del_item_state = "di_idle";
                        alert("Fetching Content with Id : " + response[0].Id + " failed !"); 
                      }.bind(this)
                    );
                break;
                case "Post" :
                    this.context.Posts.filter('it.Id == '+item_parts2del[0].id).toArray().then
                    (                                                                                                                    
                      function(response)                                                                                                 
                      {                                                                                                                  
                        this.context.Posts.remove(response[0]);                                                                                             
                        this.context.saveChanges().then
                        (
                          function(response) 
                          {
                                      // erase first item in erasure list
                            item_parts2del.splice(0,1);                          
                                      // items left to erase ? -> continue
                            if (item_parts2del.length > 0)
                            {
                              this.del_item_state = "di_del_item_parts";                  
                            }
                                      // current item is finished -> any other nodes on Queue ?                          
                            else
                            {
                              this.del_item_state = "di_get_info";                    
                            }
                                      // next iteration
                            do_del_item.call(this);                          
                          }.bind(this)
                        ).catch
                        (
                          function(response) 
                          { 
                            this.del_item_state = "di_idle";
                            alert("Removing Post with Id : " + response[0].Id + " failed !"); 
                          }.bind(this)
                        );                
                      }.bind(this)
                    ).catch
                    (
                      function(response)                                                                                                 
                      {
                        this.del_item_state = "di_idle";
                        alert("Fetching Post with Id : " + response[0].Id + " failed !"); 
                      }.bind(this)                                                                                                   
                    );
                break;
                case "PostRef" :
                    this.context.PostReferences.filter('it.Id == '+item_parts2del[0].id).toArray().then
                    (                                                                                                                    
                      function(response)                                                                                                 
                      {                                                                                                                  
                        this.context.PostReferences.remove(response[0]);                                                                                             
                        this.context.saveChanges().then
                        (
                          function(response) 
                          {
                                      // erase first item in erasure list
                            item_parts2del.splice(0,1);                          
                                      // items left to erase ? -> continue
                            if (item_parts2del.length > 0)
                            {
                              this.del_item_state = "di_del_item_parts";                  
                            }
                                      // current item is finished -> any other nodes on Queue ?                          
                            else
                            {
                              this.del_item_state = "di_get_info";                    
                            }
                                      // next iteration
                            do_del_item.call(this);                          
                          }.bind(this)
                        ).catch
                        (
                          function(response) 
                          { 
                            this.del_item_state = "di_idle";
                            alert("Removing PostRef with Id : " + response[0].Id + " failed !"); 
                          }.bind(this)
                        );                
                      }.bind(this)
                    ).catch
                    (
                      function(response)                                                                                                 
                      {
                        this.del_item_state = "di_idle";
                        alert("Fetching PostRef with Id : " + response[0].Id + " failed !"); 
                      }.bind(this)                                                                                                                  
                    );
                break; 
                default : 
                  alert("Unknown Object Type : \'" + item_parts2del[0].type + "\' Id : " + item_parts2del[0].id);
                break;
              } // switch 
            }
            else
            {
              this.del_item_state = "di_get_info";                    
              do_del_item.call(this);               
            }
        break;                      
        default : 
            this.del_item_state = "di_idle"; 
        break;  
      } // switch (this.req_tree_state)
    }.bind(this)   // var do_get_tree = function() 

    // ### first inits before any sub-function call
    var item_fifo = [];
    var item_parts2del = [];
    this.del_item_state = "di_cut_root_ref";
    // actual sub-function call (first time without blocking wait for result)
    do_del_item.call(this);
  }     // if (this.req_tree_state == "rts_idle")
  else
    alert("Del Tree already running !"); 
  
}


// get Item's parent nodes
function lib_data_disco_req_all_parents(iparams)
{
  this.context.Posts.filter('it.Id == '+iparams.elem_id)
    .include('RefersTo.Referree.Content')
    .toArray().then
  (                                                                                                                    
    function(response)                                                                                                 
    { 
      var myRefersTo = response[0].initData.RefersTo;
      this.curr_item_parents = [];
      for (var i=0; i<myRefersTo.length; i++)
      {
        this.curr_item_parents[i] = {};
        var my_parent_name = myRefersTo[i].initData.Referree.initData.Content.Title;
        if ((my_parent_name == null) || (my_parent_name == ""))
          my_parent_name = myRefersTo[i].initData.Referree.initData.Content.Text;
        this.curr_item_parents[i].name = my_parent_name;
        this.curr_item_parents[i].elem_id = myRefersTo[i].initData.Referree.initData.Id;
      }
                                    // callback function
      eval(iparams.cb_fctn_str);
    }.bind(this)
  ).catch
  (
    function(response) 
    {
      alert("Connection to Database failed");
    }.bind(this)
  );
}


// get Item's parent nodes
function lib_data_disco_get_all_parents(itemId)
{
  return this.curr_item_parents; 
}


// cut&paste operations (later : for copy by reference) 
function lib_data_disco_copy_items(iparams)
{
                                    // copy by value
  var item_queue = jQuery.extend(true, [], iparams.src_elem);
  var myPostRef = new Disco.Ontology.PostReference();

  var do_copy = function() 
  {
    this.context.PostReferences.filter('it.ReferrerId == '+item_queue[0].elem_id).toArray().then
    (
      function(response)
      {
        var myPostRefTypeId= "";
        var already_exists = false;
        for (var i=0; i<response.length; i++)
        {
                                    // find original reference to copy the ref type, too
          if (response[i].ReferreeId == item_queue[0].parent_elem_id)
          {
            myPostRefTypeId = response[i].ReferenceTypeId;
          }
          if (response[i].ReferreeId == iparams.dst_elem.elem_id)
          {
            already_exists = true; 
          }
        }
        
        if (already_exists == false)
        {
          myPostRef = new Disco.Ontology.PostReference();
          myPostRef.ReferrerId = item_queue[0].elem_id;
          myPostRef.ReferreeId = iparams.dst_elem.elem_id;
          myPostRef.ReferenceTypeId = response[0].ReferenceTypeId;
          this.context.PostReferences.add(myPostRef);                                    
          this.context.saveChanges().then
          (
            function(response)
            {
                                          // erase first item in queue
              item_queue.splice(0,1);                          
                                          // items left ? -> continue
              if (item_queue.length > 0)
              {
                do_copy();                 
              }
                                          // finished -> reprint tree
              else
              {
                this.req_tree({elemId:[iparams.dst_elem.elem_id], lock_id:iparams.lock_id, favIds:[], tickerIds:[], cb_fct_call:iparams.cb_fctn_str, mode:"tree_only"});
              }        
            }.bind(this)
          ).catch
          (
            function(response)
            {
              alert("Copy failed !");
            }.bind(this)
          );
        }  
      }.bind(this)
    ).catch
    (
      function(response)
      {
        alert("GetPostRef of Copy failed !");
      }.bind(this)
    );
  }.bind(this)
  
  do_copy();     
}


// cut&paste operations (later : for copy by reference) 
function lib_data_disco_move_items(iparams)  // iparams = {src_elem, dst_elem, old_parent_id, lock_id, cb_fctn_str}
{
  if (this.move_item_state == "mis_idle")
  {
    this.move_item_state = "mis_new_parent";
                                    // copy by value
    var copy_queue = jQuery.extend(true, [], iparams.src_elem);
    var cut_queue = jQuery.extend(true, [], iparams.src_elem);       
    var myPostRef = new Disco.Ontology.PostReference();
    
    var do_move = function() 
    {
      switch (this.move_item_state)
      {
        case "mis_new_parent" : 
            myPostRef = new Disco.Ontology.PostReference();
            myPostRef.ReferrerId = copy_queue[0].elem_id;
            myPostRef.ReferreeId = iparams.dst_elem.elem_id;
            myPostRef.ReferenceTypeId = "1";
            this.context.PostReferences.add(myPostRef);                                    
            this.context.saveChanges().then
            (
              function(response)
              {
                                            // erase first item in queue
                copy_queue.splice(0,1);                          
                                            // no items left ? -> cut from old parent
                if (copy_queue.length <= 0)
                {
                  this.move_item_state = "mis_cut_from_old_parent";
                }
                do_move();                 
              }.bind(this)
            ).catch
            (
              function(response)
              {
                alert("Paste failed !");
              }.bind(this)
            );
        break;
        case "mis_cut_from_old_parent" : 
            this.context.PostReferences.filter('it.ReferrerId == '+cut_queue[0].elem_id).toArray().then 
            (
              function(response) 
              {
                                        // find old parent object among the results
                var i=0;
                while (i<response.length) 
                {
                  if (response[i].ReferreeId == iparams.old_parent_id)
                    break;                   
                  i++;
                }            
    
                                        // delete postref
                this.context.PostReferences.remove(response[i]);                                                                                             
                this.context.saveChanges().then
                (
                  function(response) 
                  { 
                                        // erase first item in queue
                    cut_queue.splice(0,1);                             
                                        // items left ? -> continue
                    if (cut_queue.length > 0)
                    {
                      do_move();                 
                    }
                                        // finished -> reprint tree
                    else
                    {
                      this.req_tree({elemId:[iparams.dst_elem.elem_id], lock_id:iparams.lock_id, favIds:[], tickerIds:[], cb_fct_call:iparams.cb_fctn_str, mode:"tree_only"});                       
                      this.move_item_state = "mis_idle";
                    }
                  }.bind(this)
                ).catch
                (
                  function(response)
                  {
                    alert("Erase of old Parent Ref failed !");
                  }.bind(this)
                );
              }.bind(this)
            ).catch
            (
              function(response)
              {
                alert("Cut failed !");
              }.bind(this)
            );
        break;
        default :
            this.move_item_state = "mis_idle";
        break;
      }
    }.bind(this)

    do_move();     
  }
}



//################################################################################################
//### Field functions
//################################################################################################

// create fields of tree item
function lib_data_disco_create_tree_item_field(itemId, fieldId, content)
{
}



// change fields of tree item                             
function lib_data_disco_change_tree_item_field(iparams) //  iparams = {items, field_id, content, lock_id, cb_fctn_str}
{
  switch (iparams.field_id)
  {
    case "name" : 
      if (iparams.items.length == 1)
      {
        this.context.Posts.filter('it.Id == '+iparams.items[0].elem_id).include('Content').toArray().then
        (                                                                                                                    
          function(response)                                                                                                 
          {                                                                                                                  
            this.context.Content.attach(response[0].Content);
            response[0].Content.Title = iparams.content;
            this.context.saveChanges().then
            (
              function(response) 
              {
                eval(iparams.cb_fctn_str);
//                this.req_tree({elemId:[iparams.items[0].elem_id], lock_id:iparams.lock_id, favIds:[], tickerIds:[], cb_fct_call:iparams.cb_fctn_str, mode:"tree_only"});
              }.bind(this)
            ).catch
            (
              function(response) 
              {
                alert("Content not changable");
              }.bind(this)
            );                
          }.bind(this)
        ).catch
        (
          function(response) 
          {
            alert("Post not found");
          }.bind(this)
        );
      }
      else                                                                                           
        alert("Error : More than one item selected!");
    break;
    case "type" :
                                    // true copy of items and other inits
      var item_queue = jQuery.extend(true, [], iparams.items);
      var ref_queue = [];
      var chng_type_state = "chng_type_post";
      
      var do_chng_type = function() 
      {
        switch (chng_type_state)
        {
                                    // change type of the Post itself
          case "chng_type_post" : 
                                    // fetch Post Object
            this.context.Posts.filter('it.Id == '+item_queue[0].elem_id).toArray().then
            (                                                                                                
              function(response)                                                                             
              {
                                    // apply changes
                this.context.Posts.attach(response[0]);
                response[0].PostTypeId = ontology_xtm2disco_post(iparams.content);
                this.context.saveChanges().then
                (
                  function(response) 
                  {
                                    // get Ids of Post References
                    this.context.PostReferences.filter('it.ReferrerId == '+item_queue[0].elem_id).toArray().then                    
                    (                                                                                                
                      function(response)                                                                             
                      {           
                        for (var i=0; i<response.length; i++)
                        {
                          ref_queue[i] = response[i].Id;
                        }
                                    // next step : change type of all parental Post Refs
                        chng_type_state = "chng_type_postref";
                        do_chng_type();
                      }.bind(this)
                    ).catch
                    (
                      function(response) 
                      {
                        alert("Post References not found");
                      }.bind(this)
                    );  
                  }.bind(this)
                ).catch
                (
                  function(response) 
                  {
                    alert("Post Type not changable");
                  }.bind(this)
                );                
              }.bind(this)
            ).catch
            (
              function(response) 
              {
                alert("Post not found");
              }.bind(this)
            );
          break;
          case "chng_type_postref" : 
            if (ref_queue.length > 0)
            {
                                    // fetch PostRef Object
              this.context.PostReferences.filter('it.Id == '+ref_queue[0]).toArray().then
              (                                                                                                
                function(response)                                                                             
                {
                                    // apply changes
                  this.context.PostReferences.attach(response[0]);
                  response[0].ReferenceTypeId = ontology_xtm2disco_postref(iparams.content);
                  this.context.saveChanges().then
                  (
                    function(response) 
                    {
                      ref_queue.splice(0,1);
                                    // other Post Refs to change ?
                      if (ref_queue.length > 0)
                      {
                        chng_type_state = "chng_type_postref";
                        do_chng_type();
                      }
                                    // other Items selected for change ?
                      else
                      {
                        item_queue.splice(0,1);  
                        if (item_queue.length > 0)
                        {
                          chng_type_state = "chng_type_post";
                          do_chng_type();
                        }
                        else
                        {
                          this.req_tree({elemId:[iparams.items[0].elem_id], lock_id:iparams.lock_id, favIds:[], tickerIds:[], cb_fct_call:iparams.cb_fctn_str, mode:"tree_only"});                      
                        }
                      }
                    }.bind(this)
                  ).catch
                  (
                    function(response) 
                    {
                      alert("PostRef type change failed");
                    }.bind(this)
                  );
                }.bind(this)
              ).catch
              (
                function(response) 
                {
                  alert("PostRef not found");
                }.bind(this)
              );    
            }
          break; 
          default :
            alert("Wrong FSM Type");
          break;
        }
      }.bind(this)
      do_chng_type();
    break;
    case "content" :
      if (iparams.items.length == 1)
      {
        this.context.Posts.filter('it.Id == '+iparams.items[0].elem_id).include('Content').toArray().then
        (                                                                                                                    
          function(response)                                                                                                 
          {                                                                                                                  
            this.context.Content.attach(response[0].Content);
            response[0].Content.Text = encodeURIComponent(iparams.content);
            this.context.saveChanges().then
            (
              function(response) 
              {
//                this.req_tree(iparams.items[0].elem_id, iparams.lock_id, iparams.cb_fctn_str);
              }.bind(this)
            ).catch
            (
              function(response) 
              {
                alert("Content not changable");
                this.req_tree({elemId:[iparams.items[0].elem_id], lock_id:iparams.lock_id, favIds:[], tickerIds:[], cb_fct_call:iparams.cb_fctn_str, mode:"tree_only"});                
              }.bind(this)
            );                
          }.bind(this)
        ).catch
        (
          function(response) 
          {
            alert("Post not found");
          }.bind(this)
        );
      }
      else                                                                                           
        alert("Error : More than one item selected!");
    break;    
    default :
      alert("Unknown Tree Item Field to change");
    break;
  }
}



// get field content
function lib_data_disco_get_tree_item_field(itemId, fieldId)
{
  return "";
}




// Bsp. f�r Peer-to-Perr :
// ========================
// Freenet
// Media Goblin
// https://de.wikipedia.org/wiki/Gnutella
// https://de.wikipedia.org/wiki/EDonkey2000
// https://de.wikipedia.org/wiki/FastTrack
