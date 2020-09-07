import { c_KEYB_MODE_NONE } from "./global_defs.js";
import { report_duration, f_eval_bar, getInnerHTML, setInnerHTML } from "./global_functions.js";
import { global_setup } from "./global_setup.js";
import { c_LANG_UC_BROWSING_PANEL2_EVAL_CATS } from "./uc_browsing_lang.js";
import { c_LANG_LIB_TREE_ELEMTYPE } from "./lib_tree_lang.js";

import { init } from "./snabbdom/init.js";
import { classModule } from "./snabbdom/modules/class.js";
import { propsModule } from "./snabbdom/modules/props.js";
import { styleModule } from "./snabbdom/modules/style.js";
import { eventListenersModule } from "./snabbdom/modules/eventlisteners.js";
import { h } from "./snabbdom/h.js";
import { thunk } from "./snabbdom/thunk.js";

const patch = init([
  classModule,
  propsModule,
  styleModule,
  eventListenersModule
]);

// Class 'lib_tree'
export function lib_tree(gui_headline_context, lang_headline, gui_tree_context, current_usecase, current_panel, dispatcher)
{
  const handler = (operation, id, event) => this.dispatcher(this.current_usecase, this.current_panel, operation, id, c_KEYB_MODE_NONE, event);
  this.handler = handler;

  // save params to object
  this.gui_headline_context = gui_headline_context;
  this.lang_headline = lang_headline;
  this.gui_tree_context = gui_tree_context;
  this.current_usecase = current_usecase;
  this.current_panel = current_panel;
  this.dispatcher = dispatcher;

  // bind object functions
  this.init = lib_tree_init.bind(this);
  this.print_tree = lib_tree_print_tree.bind(this);

  this.print_title = lib_tree_print_title.bind(this);
  this.get_disptype_tree_vnode = get_disptype_tree_vnode.bind(this);
  this.print_disptype_tree = print_disptype_tree.bind(this);
  this.print_disptype_bubbles = print_disptype_bubbles.bind(this);
  this.print_item = lib_tree_print_item.bind(this);
  this.print_item_rec = lib_tree_print_item_rec.bind(this);
  this.print_multi_parent_menu = lib_tree_print_multi_parent_menu.bind(this);
  this.get_defpar_pairs = lib_tree_get_defpar_pairs.bind(this);
  this.get_tree = lib_tree_get_tree.bind(this);
  this.get_item_data = lib_tree_get_item_data.bind(this); 
  this.get_gui_id = lib_tree_get_gui_id.bind(this);    

  this.mark_items_as_cut = lib_tree_mark_items_as_cut.bind(this);

//  this.cancel_item = lib_tree_cancel_item.bind(this);
//  this.save_item = lib_tree_save_item.bind(this);
//  this.select_item = lib_tree_select_item.bind(this);


//  this.change_symbol = lib_tree_change_symbol.bind(this);
//  this.rename_item = lib_tree_rename_item.bind(this);
//  this.clear_item = lib_tree_clear_item.bind(this);
//

  // object attributes
  this.curr_tree_obj = [];
  this.saved_a_tag = "";
  this.eval_cat_num = c_LANG_UC_BROWSING_PANEL2_EVAL_CATS.length-1;
  this.scale_eval_tree = 100.0;
  this.empty_eval_struct = [];

  // private:
  this.vnode = null;

  // constructor  
  this.init();
}


// #######################################################################################
// ### Global Functions                                                                ###
// #######################################################################################

function lib_tree_init()
{
  // init object variables  
  for (var i=0; i<this.eval_cat_num; i++)
  {
    this.empty_eval_struct[i] = {};
    this.empty_eval_struct[i].avg = 0.0;
    this.empty_eval_struct[i].num = 0;
  }
  
  this.print_title();
}


// for init and for language change
function lib_tree_print_title()
{
  const self = this;
  var on_click = function(event) { return self.handler("switch_disp", this.id, event) };
  var link_html = '<span><a id="panel1_headline_a"><B>' + this.lang_headline[2+global_setup.display_type] + '</B></a></span>';

  const container = document.getElementById(this.gui_headline_context);
  setInnerHTML(container, link_html);
  const a_elem = container.getElementsByTagName("a")[0];
  a_elem.onclick = on_click;
}


// #######################################################################################
// ### Tree Functions                                                                  ###
// #######################################################################################

function lib_tree_print_item_rec(pos, selected_gui_ids, expanded_gui_ids, create_gui_id, rename_gui_id) {
  var self = this;
  const node = pos.get_node();
  const gui_id = pos.get_gui_id();
  const selected = selected_gui_ids.indexOf(gui_id) >= 0;
  const expanded = expanded_gui_ids[gui_id] !== undefined;
  const on_click = function(event) { return self.handler("tree_select", gui_id + "_a", event) };
  const rename_this = pos.get_gui_id() === rename_gui_id;
  const create_child = pos.get_gui_id() === create_gui_id;

  const children = pos.locate_children().map(child_pos => {
    return self.print_item_rec(child_pos, selected_gui_ids, expanded_gui_ids, create_gui_id, rename_gui_id);
  });

  if (create_child) {
    const new_node = {
      name: "",
      type: node.type, // is this right?
      eval: this.empty_eval_struct
    };
    const new_vnode = this.print_item("N0", new_node, () => {}, false, false, [], true);
    children.push(new_vnode);
  }

  return this.print_item(pos.get_gui_id(), pos.get_node(), on_click, selected, !expanded, children, rename_this);
}

function lib_tree_print_item(node_gui_id, node, on_click, selected, hide_ul, children, rename) {
  // HTML-Code :
  // <LI>
  //   <IMG ... /IMG>  
  //   <DIV ...>
  //     <span><A .../A></span>
  //   </DIV>
  //   <UL .../UL>
  // </LI>
  
  const self = this;
  const gui_id = node_gui_id + '_a';



  const img_vnode = h("img#" + node_gui_id + "_sym", {
      props: {
        src: node.type !== "none" ? lib_tree_get_symb(node.type) : "",
        //align: "left",
        width: 20,
        height: 20
      },
    on: {
      mouseenter: () => {
        if (hide_ul) {
          self.handler("expand_children", node_gui_id, undefined);
        } else {
          self.handler("collapse_children", node_gui_id, undefined);
        }
      }
    }
    });

  const name_class = node.is_deleted === 1
    ? "div deleted"
    : "div";
  const name_vnode = h("div#" + node_gui_id + "_div", {
    props: {
      className: name_class
    }
  }, [
    img_vnode,
    h("span", [
      !rename
        ? h("a#" + gui_id + ".name", {
          on: {
            click: on_click
          }}, [ node.name ])
        : h("input#name_input", {
          props: {
            type: "text",
            value: node.name
          },
          hook: {
            insert: vnode => { vnode.elm.focus(); vnode.elm.select(); }
          }})
    ])
  ]);

  const ul_class = hide_ul ? "children hide" : "children";
  const ul_vnode = h("ul#" + node_gui_id + "_ul", {
    props: {
      className: ul_class
    }
  }, children);

  const ret_class = selected ? "tree-item selected" : "tree-item";
  return h("li#" + node_gui_id + "_li", { key: node_gui_id, props: { className: ret_class } }, [
    name_vnode,
    ul_vnode
  ]);

//                                     // LI container for single Item  
//   var newLiItem = document.createElement("li");
//     newLiItem.id = node.gui_id+"_li";
//     newLiItem.style.cssText = 'list-style: none; margin: 0; padding: 0;';    
//                                     // Symbol displaying the Element Type
//   var newTypeImgItem = document.createElement("img");
//   if (node.type != "none")
//   {
//     newTypeImgItem.id = node.gui_id+"_sym";
//     newTypeImgItem.src = lib_tree_get_symb(node.type);
//     newTypeImgItem.align = "left";
//     newTypeImgItem.width = 20;  
//     newTypeImgItem.height = 20;    
//   }    
// 	                                  // Element Name	  
//   var newDivItem = document.createElement("div");
//     newDivItem.id = node.gui_id+'_div';
//     if (node.is_deleted === 1)
//       newDivItem.style.cssText = 'display: block;  color:#FFFFB0; list-style: none; width:100%; margin: 0.1em; padding: 0; vertical-align: top; margin-left:-1.5em;';
//     else
//       newDivItem.style.cssText = 'display: block;  color:#3030C0; list-style: none; width:100%; margin: 0.1em; padding: 0; vertical-align: top; margin-left:-1.5em;';            
//     setInnerHTML(newDivItem, '<span><a id=\"' + gui_id + '\" style=\"display: block; padding-top:0.2em; padding-left:1em;\">' + node.name + '</a></span>');  
//     const a_elem = newDivItem.getElementsByTagName("a")[0];
//     a_elem.onclick = on_click;
//                                     // Prepare container for Child Elements (UL)
//   var newUlItem = document.createElement("ul");
//     newUlItem.id = node.gui_id+"_ul";
//     newUlItem.style.cssText = 'margin: 0; padding-left: 1.5em';
//     if (hide_ul)
//       newUlItem.style.display = "none";
//                                     // connect items
//                                     // 1.) insert Type Symbol as first child into Container
//   newLiItem.appendChild(newTypeImgItem);     
//                                     // 2.) insert Hierarchy Config Symbol (if avail) as second child
//   if (node.tree_hier != undefined)
//   {
//     var newHierImgItem = document.createElement("img");
//     newHierImgItem.id = node.gui_id+"_hiercfg_sym";
//     newHierImgItem.src = "symbol_cfg.gif";
//     newHierImgItem.align = "left";
//     newHierImgItem.width = 22;  
// 	  newHierImgItem.height = 22;
//     newLiItem.appendChild(newHierImgItem);  
//   }           
//                                     // generate Evaluation Bar and fit it together with name field
//   var eval_value = 0.0;
//   if (node.eval != undefined) 
//   {
//     for (var i=0; i<this.eval_cat_num; i++)
//     { 
//       if (node.eval[i] != undefined)
//         eval_value = eval_value + node.eval[i].avg;
//     }
//   }
//   eval_value = ((eval_value / (this.eval_cat_num * 1.0)) / global_setup.eval_scale_db) * this.scale_eval_tree;
//   const my_eval_bar = f_eval_bar(newDivItem, eval_value);      
//   my_eval_bar.style.marginLeft = "2.8em";    
//                                     // 3.) insert Name field with Eval Bar as third child
//   newLiItem.appendChild(newDivItem);
//                                     // 4.) insert Child List as fourth child  
//   newLiItem.appendChild(newUlItem);
//                                     // insert current Item into parent's UL element
//   root_ul.appendChild(newLiItem);
// 
//   insert_children(newUlItem);
}

function print_disptype_tree(state)
{
  const vnode = this.get_disptype_tree_vnode(state);

  var old;
  if (this.vnode) {
    old = this.vnode;
  } else {
    old = document.getElementById(this.gui_tree_context); 
    old.innerHTML = "";
  }
  this.vnode = patch(old, vnode);
}

function get_disptype_tree_vnode(state)
{
  if (!state.is_available) {
    return h("span", ["Loading..."]);
  } else if (state.operation === "paste") {
    return h("span", ["Pasting..."]);
  } else if (state.operation === "delete") {
    return h("span", ["Deleting..."]);
  } else if (state.operation === "rename") {
    return h("span", ["Renaming..."]);
  } else if (state.operation === "create") {
    return h("span", ["Creating..."]);
  }

  const self = this;
  const start_time = new Date();
                                    // initialize for Explorer Bar

  const tree = state.tree;
  const selected = state.selected;
  const expanded = state.expanded;
  const creating = state.creating;
  const renaming = state.renaming;

  const explorer_item_vnodes = [];

  // part 1 : print Explorer Bar
  const explorer_bar_items = [];
  for (var predecessor = tree.locate_pivot(); predecessor.locate_parent() !== null; predecessor = predecessor.locate_parent()) {
                                    // prepare variables
    var position = predecessor.locate_parent();
    var node = position.get_node();
    var gui_id = position.get_gui_id();
    const gui_id_a = gui_id + "_a";
    const gui_id_mult = gui_id + "_pmenu_a";
    const predecessor_node = predecessor.get_node();

    const visible_name = position.locate_parent() === null
      ? "[" + node.name + "]"
      : node.name;
    const on_click = function (event) { return self.handler("explorer_select", gui_id_a, event) };
    const on_click_multi = function (event) { return self.handler("open_parent_menu", predecessor.get_gui_id() + "_a", event) };

    const link_vnode = h("span", [
        h("a#" + gui_id_a, { on: { click: on_click } }, [ visible_name ])
    ]);
    const parents_link_vnode = predecessor_node.isMultiPar
      ? h("span", [
          h("a#" + gui_id_mult, { on: { click: on_click_multi } }, [ "{...}" ])
        ])
      : undefined;
    const item_vnode = h("span.nav-item", [ link_vnode, parents_link_vnode ]);
    explorer_item_vnodes.push(item_vnode);
  }
  // add Explorer Path to GUI

  const navbar_vnode = h("div.navbar", explorer_item_vnodes);
  
  // part 2 : print child elements as tree
  var retval = {};

                                    // print stub elements
  const highlevel_siblings = tree.locate_pivot().locate_siblings();
  const tree_item_vnodes = highlevel_siblings.map(sibling_pos => {
    const is_pivot = sibling_pos.equals_to(tree.locate_pivot());
    if (is_pivot)
    {
      retval = sibling_pos.get_node();
    }
    return this.print_item_rec(sibling_pos, selected, expanded, creating, renaming); // TODO
  });

  const tree_root_div = h("div.tree", [
    navbar_vnode,
    h("ul#" + this.current_panel + "_root_ul.siblings", tree_item_vnodes)
  ]);

  const vnode = h("div#" + this.gui_tree_context, [
    tree_root_div
  ]);

  return vnode;

  return retval;  
}


// print part of a tree in the respective GUI element
function lib_tree_print_tree(state)
{
  this.curr_tree_obj = state.tree;
  // for performance analysis
  const start_time = new Date();

                                    // save tree data object as local object variable
  // this.curr_tree_obj = jQuery.extend(true, {}, tree_obj);  
  
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // look up data in node array
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~  
  // var selected_item_in_tree = find_node_by_id(tree_obj, sel_elem_id);

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // execute print function for selected display type
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~  
  var retval;
  if (global_setup.display_type == 0)
    retval = this.print_disptype_tree(state);
  else
    retval = this.print_disptype_bubbles(tree_obj, sel_elem_id, selected_item_in_tree);

  const end_time = new Date();
  console.log("Tree printing took " + (end_time - start_time) + " milliseconds.");
  
  //return retval;
}

function lib_tree_get_type_no(typeInternalStr)
{
  for (var i=0; i<c_LANG_LIB_TREE_ELEMTYPE.length; i++)
  {
    if (typeInternalStr == c_LANG_LIB_TREE_ELEMTYPE[i][0])
      return i - 1;
  }
  return -1;
}


// find respective symbol depending on item type
function lib_tree_get_symb(itemType)
{
  for (var i=0; i<c_LANG_LIB_TREE_ELEMTYPE.length; i++)
  {
    if (itemType == c_LANG_LIB_TREE_ELEMTYPE[i][0])
      return "symbol_" + c_LANG_LIB_TREE_ELEMTYPE[i][0] + ".gif";
  }
  return "symbol_unknown.gif";
}


function lib_tree_print_multi_parent_menu(parent_list)
{
  const self = this;
  const click_handlers = [];
  var html_text = "&nbsp;<I>" + c_LANG_LIB_TREE_MSG_MULTI_CHOICE[global_setup.curr_lang] + " :</I><BR><BR>";
  var gui_context = document.getElementById(this.gui_tree_context);
  for(var a=0; a<parent_list.length; a++)
  {
    const on_click = function (event) { return self.handler("parent_menu_select", this.id, event) };
    click_handlers.push(on_click);
    html_text = html_text + '&nbsp;<a id=\"' + parent_list[a].elem_id + '_a\">' + parent_list[a].name + '</a><br>';
  }
  setInnerHTML(gui_context, html_text);
  gui_context.getElementsByTagName("a").forEach((el, i) => {
    el.onclick = click_handlers[i];
  });
}


// get pairs of elems and their default parents
function lib_tree_get_defpar_pairs(gui_id)
{
  var parent_found = false;
  var retval_idx = 0;
  var retval = [];
  var srch_gui_id = gui_id;
                                    // search through all nodes from currently clicked to root 
                                    // and find all multi parent pairs to be set by default
  for (var i=(this.curr_tree_obj.tree_nodes.length-1); i>=0; i--)
  {
                                    // found currently searched item
    if (this.curr_tree_obj.tree_nodes[i].gui_id == srch_gui_id)
    {
      if (this.curr_tree_obj.tree_nodes[i].isMultiPar)
      {
        retval[retval_idx] = {};
        retval[retval_idx].elem_id = this.curr_tree_obj.tree_nodes[i].elem_id;
        retval[retval_idx].parent_id = this.curr_tree_obj.tree_nodes[i].parent_elem_id;
        retval_idx++;
      } 
      srch_gui_id = this.curr_tree_obj.tree_nodes[i].parent_gui_id;
      start_idx = i-1;
      break;
    }
  }
  return retval;
}

function lib_tree_get_tree()
{
  return this.curr_tree_obj;
}                            
                          

function lib_tree_get_item_data(gui_id)
{
  return this.curr_tree_obj.get_graph().get_node_by_gui_id(gui_id);
}


function lib_tree_get_gui_id(elem_id)
{
  var retval = [];
  var retval_idx = 0;
  if (this.curr_tree_obj.explorer_path != undefined)
  {
                                    // search through Explorer Path
    for (var i=0; i<this.curr_tree_obj.explorer_path.length; i++)
      if (this.curr_tree_obj.explorer_path[i].elem_id == elem_id)
        retval[retval_idx++] = this.curr_tree_obj.explorer_path[i].gui_id;
  }
  if (this.curr_tree_obj.tree_nodes != undefined)
  {
                                    // search through Tree Path
    for (var i=0; i<this.curr_tree_obj.tree_nodes.length; i++)
      if (this.curr_tree_obj.tree_nodes[i].elem_id == elem_id)
        retval[retval_idx++] = this.curr_tree_obj.tree_nodes[i].gui_id;
  }
      
  return retval;
}
           
function lib_tree_mark_items_as_cut(cut_items, is_marked)
{
  for (var i=0; i<cut_items.length; i++)
  {
                              // extract elem_id from cut items collected from (possibly) old tree
    var my_elem_id = cut_items[i].elem_id;
    var my_parent_elem_id = cut_items[i].parent_elem_id;    
                              // get GUI Id's if element appears in current tree
    var my_gui_id = this.get_gui_id(my_elem_id);
                              // does element exist in current tree ?
    if (my_gui_id.length > 0)
    {
      for (var j=0; j<my_gui_id.length; j++)
      {
        if (this.get_item_data(my_gui_id[j]).parent_elem_id[0] == my_parent_elem_id[0])
        {
          if (is_marked)
            if ((this.get_item_data(my_gui_id[j]).subtree % 2) == 1)          
              document.getElementById(my_gui_id[j] + '_a').style.color = '#FFB0B0';                        
            else
              document.getElementById(my_gui_id[j] + '_a').style.color = '#D0D0D0';
          else
          {
            if ((this.get_item_data(my_gui_id[j]).subtree % 2) == 1)
              document.getElementById(my_gui_id[j] + '_a').style.color = '#C03030';                          
            else if (this.get_item_data(my_gui_id[j]).is_deleted === 1)
              document.getElementById(my_gui_id[j] + '_a').style.color = '#FFFFB0'; 
            else
              document.getElementById(my_gui_id[j] + '_a').style.color = '#3030C0';            

          }
        }  
      }
    }
  }
}


// #######################################################################################
// ### Bubble Functions                                                                ###
// #######################################################################################

function print_disptype_bubbles(tree_obj, sel_elem_id, selected_item_in_tree)
{
  var gui_context = document.getElementById(this.gui_tree_context);
  setInnerHTML(gui_context, "<div id=\"bubble_home\"></div>");

  // constants
  var c_PARENT_FILL  = "#D0D0FF";   var c_PARENT_STROKE   = "#3030FF";  var c_TARGET_FOR_PARENT = 1;    var c_PARENT_LINK_COLOR   = "#00C";
  var c_SIBLING_FILL = "#80FF80";   var c_SIBLING_STROKE  = "#008000";  var c_TARGET_FOR_SIBLING = 2;   var c_SIBLING_LINK_COLOR  = "#0C0";
  var c_CHILD_FILL   = "#FF60FF";   var c_CHILD_STROKE    = "#8F008F";  var c_TARGET_FOR_CHILD = 3;     var c_CHILD_LINK_COLOR    = "#C00";

  // basic init of graph data
  var graph = {
    "nodes":[
      // Element
      {"id":selected_item_in_tree.gui_id+"_a", "name":selected_item_in_tree.name.replace(/&rsaquo;/g,'>'), "fill":"#FFFFB0", "stroke":"#0000C0", "symbol":""},    
      // Sub-Branches
      {"id":"A0_a", "name":"  ","fill":"#8080FF","stroke":"#000040", "symbol":""},         // Parents
      {"id":"A1_a", "name":"  ","fill":"#00C000","stroke":"#002000", "symbol":""},         // Siblings
      {"id":"A2_a", "name":"  ","fill":"#C000C0","stroke":"#200020", "symbol":""}          // Children
    ],
    "links":[
      // Sub-Branches
      {"source":1,"target":0,"color":"#AAA"},
      {"source":2,"target":0,"color":"#AAA"},
      {"source":3,"target":0,"color":"#AAA"}
    ]
  };
  
  var curr_node_idx = graph.nodes.length;
  var curr_link_idx = graph.links.length;  

  // Parent Nodes
  var curr_node = tree_obj.explorer_path[0];
  if (curr_node != undefined)
  {
    graph.nodes[curr_node_idx] = {};
    graph.nodes[curr_node_idx].id = curr_node.gui_id + "_a";
    graph.nodes[curr_node_idx].name = curr_node.name.replace(/&rsaquo;/g,'>');
    if (curr_node.type != "none")
      graph.nodes[curr_node_idx].symbol = lib_tree_get_symb(curr_node.type);   
    else
      graph.nodes[curr_node_idx].symbol = "symbol_unknown.gif";
    graph.nodes[curr_node_idx].fill = c_PARENT_FILL;   graph.nodes[curr_node_idx].stroke = c_PARENT_STROKE;
    
    
    graph.links[curr_link_idx] = {};
    graph.links[curr_link_idx].source = curr_node_idx++;
    graph.links[curr_link_idx].target = c_TARGET_FOR_PARENT;
    graph.links[curr_link_idx++].color = c_PARENT_LINK_COLOR;  
  }
   
  // other node types
  if (tree_obj.tree_nodes != undefined)  
  {
    for (var i=0; i<tree_obj.tree_nodes.length; i++)
    {  
      curr_node = tree_obj.tree_nodes[i];
      
      // Sibling Nodes
      if ((curr_node.parent_gui_id == selected_item_in_tree.parent_gui_id) && (curr_node.elem_id != selected_item_in_tree.elem_id))
      {
        graph.nodes[curr_node_idx] = {};
        graph.nodes[curr_node_idx].id = curr_node.gui_id + "_a";
        graph.nodes[curr_node_idx].name = curr_node.name.replace(/&rsaquo;/g,'>');      
        if (curr_node.type != "none")
          graph.nodes[curr_node_idx].symbol = lib_tree_get_symb(curr_node.type);   
        else
          graph.nodes[curr_node_idx].symbol = "symbol_unknown.gif";      
        graph.nodes[curr_node_idx].fill = c_SIBLING_FILL;   graph.nodes[curr_node_idx].stroke = c_SIBLING_STROKE;
        graph.links[curr_link_idx] = {};
        graph.links[curr_link_idx].source = curr_node_idx++;
        graph.links[curr_link_idx].target = c_TARGET_FOR_SIBLING;
        graph.links[curr_link_idx++].color = c_SIBLING_LINK_COLOR;  
      }
    
      // Child Nodes
      if (curr_node.parent_gui_id == selected_item_in_tree.gui_id)
      {
        graph.nodes[curr_node_idx] = {};
        graph.nodes[curr_node_idx].id = curr_node.gui_id + "_a";
        graph.nodes[curr_node_idx].name = curr_node.name.replace(/&rsaquo;/g,'>');      
        if (curr_node.type != "none")
          graph.nodes[curr_node_idx].symbol = lib_tree_get_symb(curr_node.type);   
        else
          graph.nodes[curr_node_idx].symbol = "symbol_unknown.gif";      
        graph.nodes[curr_node_idx].fill = c_CHILD_FILL;   graph.nodes[curr_node_idx].stroke = c_CHILD_STROKE;
        graph.links[curr_link_idx] = {};                  
        graph.links[curr_link_idx].source = curr_node_idx++;
        graph.links[curr_link_idx].target = c_TARGET_FOR_CHILD;
        graph.links[curr_link_idx++].color = c_CHILD_LINK_COLOR;  
      }
    }
  }
  
  const self = this;
  on_click = function (event) { return self.handler("explorer_select", this.id, event) };
  
  var width = 960,
      height = 500;
  
  var color = d3.scale.category20();
  
  var force = d3.layout.force()
      .charge(-1000)
      .linkDistance(60)
      .size([width, height]);
  
  var svg = d3.select("#bubble_home").append("svg")
      .attr("width", width)
      .attr("height", height);
  
  var drawGraph = function(graph) {
    force
        .nodes(graph.nodes)
        .links(graph.links)
        .start();
  
    var link = svg.selectAll(".link")
        .data(graph.links)
        .enter().append("line")
        .attr("class", "link")
        .style("stroke-width", function(d) { return Math.sqrt(d.value); })
        .style("stroke", function(d) { return d.color; });             
  
    var gnodes = svg.selectAll('g.gnode')
       .data(graph.nodes)
       .enter()
       .append('g')
       .classed('gnode', true);
      
    var elementHeight = 15;
    var elementWidth = 9;  // size per letter 

    var node = gnodes.append("rect")
        .attr("id", function(d) { return d.id;})
        .attr("class", "node")
        .attr("height", elementHeight)
        .attr("width", function(d) { return elementWidth*d.name.length; })
//        .on('mouseover', function() { alert('over1'+this.id); } )
//        .on('mouseout', function() { alert('out1'+this.id); } )        
        .on("click", on_click)            
        .style("fill", function(d) { return d.fill; })
        .style("stroke", function(d) { return d.stroke; }) 
        .style("stroke-width", function(d) { if (d.index==0) return "2.5px"; else return "1.5px";})           
        .call(force.drag);
  
      var mysymbs = gnodes.append("svg:image")
          .attr("xlink:href", function(d) { return d.symbol; })
          .attr("width", 20)  
          .attr("height", 20)
          .attr("x","2")
          .attr("y","-22");
  
    var labels = gnodes.append("text")
        .text(function(d) { return d.name; })
        .attr("id", function(d) { return d.id;})
        .style("fill", function(d) { return d.stroke; })                        
        .attr("text-anchor", "start")
        .attr("x","2")
        .attr("y","12")
//        .on('mouseover', function() { alert('over2'+this.id); } )            
//        .on('mouseout', function() { alert('out2'+this.id); } )                
//        .on("click", function(event) {alert('click2'+this.id); eval(on_click_str);  return;}.bind(on_click_str))
        .on("click", on_click)            
        .style("font", function(d) { if (d.index==0) return "10pt courier"; else return "10pt courier";})
        .call(force.drag);
  
      
    force.on("tick", function() {
      link.attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });
      gnodes.attr("transform", function(d) { 
          return 'translate(' + [d.x-(elementWidth*d.name.length/2), d.y-(elementHeight/2)] + ')'; 
      });        
    });
  };
  
  drawGraph(graph);  
  
  return selected_item_in_tree;
}
