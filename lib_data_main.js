import { c_DATA_SOURCE_TYPE_ID_HTML, c_DATA_SOURCE_TYPE_ID_XML, c_DATA_SOURCE_TYPE_ID_PAUL } from "./global_defs.js";
import { lib_data_paul } from "./lib_data_paul.js";
import { c_LANG_LIB_DATA_MSG_UNKNOWN_COMMAND } from "./lib_data_lang.js";

// https://piratenpad.de/p/3dCFdjUeoUAPY
// http://jsfiddle.net/rniemeyer/LkqTU/
// http://jsfiddle.net/stevegreatrex/RZXyT/1/
// http://knockoutjs.com/examples/clickCounter.html


export function lib_data_main(defaultParentStorage, uc_browsing_setup, uc_browsing_save_setup, global_setup, global_main_save_setup)
{
  // take over params
  this.defaultParentStorage = defaultParentStorage;
  this.uc_browsing_setup = uc_browsing_setup;
  this.uc_browsing_save_setup = uc_browsing_save_setup;
  this.data_src_type = uc_browsing_setup.tree_data_src_type;
  this.data_src_path = uc_browsing_setup.tree_data_src_path;
  this.data_src_params = uc_browsing_setup.tree_data_src_params;
  this.global_setup = global_setup;    
  this.global_main_save_setup = global_main_save_setup;
  
  
  // bind local functions
  this.init = lib_data_main_init.bind(this);
  this.command = lib_data_main_command.bind(this);
  this.get_tree_item_parents = lib_data_main_get_tree_item_parents.bind(this);
  this.set_default_parents = lib_data_main_set_default_parents.bind(this);

  this.req_tree = lib_data_main_req_tree.bind(this);
  this.req_tree_only = lib_data_main_req_tree_only.bind(this);
  this.delete_tree_item = lib_data_main_delete_tree_item.bind(this);
  this.create_tree_item = lib_data_main_create_tree_item.bind(this);
  this.change_tree_item_field = lib_data_main_change_tree_item_field.bind(this);
  this.copy_items = lib_data_main_copy_items.bind(this);
  this.move_items = lib_data_main_move_items.bind(this);
  
  // object variables
  this.db_obj = null;
  
  // start constructor
  this.init();
}


function lib_data_main_init() 
{
  switch (this.data_src_type)
  {                               
    case c_DATA_SOURCE_TYPE_ID_HTML :
        this.db_obj                     = new lib_data_html(this.data_src_path, this.data_src_params, this.defaultParentStorage, this.global_setup, this.global_main_save_setup);     
    break;
    case c_DATA_SOURCE_TYPE_ID_XML :
        this.db_obj                     = new lib_data_xml(this.data_src_path, this.data_src_params, this.defaultParentStorage, this.global_setup, this.global_main_save_setup); 
    break;
    case c_DATA_SOURCE_TYPE_ID_PAUL :
        this.db_obj                     = new lib_data_paul(this.data_src_path, this.data_src_params, this.defaultParentStorage, this.global_setup, this.global_main_save_setup);  
    break;
    default :
        alert('Undefined Data Source : '+ this.data_src_type);
    break;
  }
  
}


function lib_data_main_command(iparams, cmd_name)
{
  var ovalues = [];
  switch (cmd_name)
  {
    case "req_tree"                     : ovalues = this.db_obj.req_tree(iparams); break;
    case "req_tree_only"                : this.db_obj.req_tree_only(iparams); break;
    case "get_tree"                     : ovalues = this.db_obj.get_tree(iparams); break;
    case "write_tree"                   : this.db_obj.write_tree(iparams); break; // not needed anymore?
    case "delete_item"                  : this.db_obj.delete_tree_item(iparams); break;
    case "create_item"                  : this.db_obj.create_tree_item(iparams); break;
    case "change_item_field"            : this.db_obj.change_tree_item_field(iparams); break;
    case "copy_item"                    : this.db_obj.copy_items(iparams); break;
    case "move_item"                    : this.db_obj.move_items(iparams); break;
    case "req_all_parents"              : this.db_obj.req_all_parents(iparams); break;
    case "get_all_parents"              : ovalues = this.db_obj.get_all_parents(iparams); break;
    
    case "set_default_parents"          : this.set_default_parents(iparams); break;
    default : 
      alert(c_LANG_LIB_DATA_MSG_UNKNOWN_COMMAND[this.global_setup.curr_lang] + cmd_name);
      ovalues = null;
    break; 
  }
  return ovalues; 
}

function lib_data_main_req_tree(iparams) {
  return this.command(iparams, "req_tree");
}

function lib_data_main_req_tree_only(iparams) {
  return this.command(iparams, "req_tree_only");
}

function lib_data_main_delete_tree_item(iparams) {
  return this.command(iparams, "delete_item");
}

function lib_data_main_create_tree_item(iparams) {
  return this.command(iparams, "create_item");
}

function lib_data_main_change_tree_item_field(iparams) {
  return this.command(iparams, "change_item_field");
}

function lib_data_main_copy_items(iparams) {
  return this.command(iparams, "copy_item");
}

function lib_data_main_move_items(iparams) {
  return this.command(iparams, "move_item");
}


function lib_data_main_get_tree_item_parents(iparams)
{
  var my_parents = this.db_obj.get_tree_item_parents(iparams.elem_id);
  var ret_struct = [];

  for(var a=0; a<my_parents.length; a++)
  {
    ret_struct[a] = {};
    ret_struct[a].elem_id = my_parents[a];
    ret_struct[a].name = this.db_obj.get_tree_item_field(my_parents[a], "name");
  } 
  return ret_struct;
}




function lib_data_main_set_default_parents(link_list)
{
  for (var i=0; i<link_list.length; i++)
  {
    this.defaultParentStorage.write(link_list[i].elem_id, link_list[i].parent_id);
  }
}



