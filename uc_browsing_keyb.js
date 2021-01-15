import { c_KEYB_MODE_NONE, c_KEYB_MODE_CTRL_ONLY, c_KEYB_MODE_SHIFT_ONLY, c_KEYB_MODE_ALT_ONLY } from "./global_defs.js";
import { global_setup, c_DEFAULT_GLOBAL_SETUP } from "./global_setup.js";
import { htmlEntities } from "./global_functions.js";
import { c_LANG_UC_BROWSING_MENUBAR } from "./uc_browsing_lang.js";

// Class 'uc_browsing_keyb' -> Keyboard Handling for Usecase "Browsing"
export function uc_browsing_keyb(main)
{
  
  this.main = main;  
  
  this.keyb_proc = uc_browsing_keyb_keyb_proc.bind(this);
  
}  

function uc_browsing_keyb_keyb_proc(my_key, my_extra_keys, e)
{
  // check for too long inputs in tree panel
  if (this.main.text_focus == 1)
  {
    var my_item = null;
    if (this.main.panel1_new_tree_item_input == true)
    {
                                    // get new name from lib_tree
      my_item = document.getElementById("N0_input");
    }
    if (this.main.panel1_saved_rename_item != null)
    {
      my_item = document.getElementById(this.main.panel1_saved_rename_item.gui_id + "_input");
    }
    if (my_item != null)
    {
      var my_name = htmlEntities(my_item.value);
      if (my_name.length > c_DEFAULT_GLOBAL_SETUP.tree_item_max_letters)
      {
        my_item.style.color = "red";
      }
      else
      {
        my_item.style.color = "black";
      }
    }
  }  
                                    // ... otherwise use these options
  switch (my_extra_keys)
  {
    // No extra key
    case c_KEYB_MODE_NONE :
        
        switch (my_key)
        {
//            // TAB - shift items one level down (1st child)
//            case 9 :
//              //alert("Tab");
//                                      // cut selected items
//              this.main.process_elem_menu("cut_item");
//                                      // grab 1st child's GUI ID ...
//              var mychildren_gui_id = lib_tree_get_children(this.main.panel1_cut_items[0].gui_id);
//              this.main.panel1_selected_items = [];
//              this.main.panel1_selected_items[0] = this.main.tree_panel.get_item_data(mychildren_gui_id[0]);
//                                      // ... and paste them
//              this.main.process_elem_menu("paste_item");
//            break;
            
          // ENTER
          case 13 :
            //alert("Enter");
//            if ((this.main.panel1_new_tree_item_input == true) || (this.main.panel1_saved_rename_item != null))
//            {
//              this.main.text_focus = 0;
//
//              if (this.main.panel1_new_tree_item_input == true)
//              {
//                                          // get new name from lib_tree and limit number of letters
//                var item_name = htmlEntities(document.getElementById("N0_input").value);
//                item_name = item_name.substring(0, c_DEFAULT_GLOBAL_SETUP.tree_item_max_letters);
//                                          // clear flag
//                this.main.panel1_new_tree_item_input = false;
//                                          // create item in database
//                var on_click_str = "window." + this.main.cb_clicked_at_str + "(\'uc_browsing\', \'panel1\', \'show_tree\', \'T0_a\', c_KEYB_MODE_NONE);";            
//                this.main.db_obj.command({parent_elem_id:this.main.panel1_selected_items[0].elem_id, name:item_name, type:c_LANG_LIB_TREE_ELEMTYPE[this.main.panel1_elem_type+1][0], lock_id:uc_browsing_setup.tree_locked_item, cb_fctn_str:on_click_str}, "create_item");
//              }
//              if (this.main.panel1_saved_rename_item != null)
//              {
//                                          // get new name from lib_tree and limit number of letters
//                var item_name = htmlEntities(document.getElementById(this.main.panel1_saved_rename_item.gui_id + "_input").value);
//                item_name = item_name.substring(0, c_DEFAULT_GLOBAL_SETUP.tree_item_max_letters);
//                                          // clear flag
//                this.main.panel1_saved_rename_item = null;
//                                          // option : history logging in comment area
//                if (uc_browsing_setup.history_logging)
//                {
//                                          // get date
//                  var now = new Date();
//                  var myDate = now.getFullYear()+ '/' + (now.getMonth()+1 < 10 ? '0'+(now.getMonth()+1) : now.getMonth()+1) + '/' + (now.getDate()<10 ? '0'+now.getDate() : now.getDate());          
//                                          // create String reflecting Evaluation before renaming
//                  var myEvalStr = "";                                    
//                  var anyNonZeroEval = 0;
//                  for (var i=1; i<c_LANG_UC_BROWSING_PANEL2_EVAL_CATS.length; i++)
//                  {
//                    if (this.main.panel1_selected_items[0].eval[i-1].num > 0)
//                    {
//                      if (anyNonZeroEval != 0)
//                        myEvalStr = myEvalStr + ', ';
//                      myEvalStr = myEvalStr + c_LANG_UC_BROWSING_PANEL2_EVAL_CATS[i][0] + ':' + this.main.panel1_selected_items[0].eval[i-1].avg;
//                      anyNonZeroEval = 1;
//                    }
//                  }
//                                          // insert old name and evaluation results in comment field (w.o. reloading)
//                  this.main.panel1_selected_items[0].comment = this.main.panel1_selected_items[0].comment + '<br><br>### OP:Renaming, DATE:' + myDate + ', OLD NAME:' + this.main.panel1_selected_items[0].name + ', EVAL:\{' + myEvalStr + '\} ###<br><br><br>';
//                  this.main.db_obj.command({items:this.main.panel1_selected_items, field_id:"comment", content:this.main.panel1_selected_items[0].comment, lock_id:uc_browsing_setup.tree_locked_item, cb_fctn_str:""}, "change_item_field");          
//                }
//                                          // change item name in database (w.o. reloading)
//                var on_click_str = "window." + this.main.cb_clicked_at_str + "(\'uc_browsing\', \'panel1\', \'show_tree\', \'T0_a\', c_KEYB_MODE_NONE);";                      
//                this.main.db_obj.command({items:this.main.panel1_selected_items, field_id:"name", content:item_name, lock_id:uc_browsing_setup.tree_locked_item, cb_fctn_str:on_click_str}, "change_item_field");
//                                          // clear evaluation (with reloading)
//                  this.main.db_obj.command({items:this.main.panel1_selected_items, field_id:"eval", content:c_EMPTY_EVAL_STRUCT, lock_id:uc_browsing_setup.tree_locked_item, cb_fctn_str:on_click_str}, "change_item_field");                    
//              }
//            }
                const name_input = document.getElementById("name_input");
                if (name_input === null) {
                  break;
                }

                var item_name = name_input.value;
                item_name = item_name.substring(0, c_DEFAULT_GLOBAL_SETUP.tree_item_max_letters);

                this.main.model.apply_name_input(item_name);
          break;
  
          // ESC
          case 27 :
            //alert("ESC");
            if (this.main.text_focus == 1)
            {
							this.main.model.skip_name_input();            	
            }
            this.main.text_focus = 0;            
           
          break;
  
          // F2
          case 113 :
            //alert("F2");
            if (this.main.text_focus == 0)
            {
              this.main.clicked_at("menubar", c_LANG_UC_BROWSING_MENUBAR[0][0][0], "change_item", c_KEYB_MODE_NONE);            
            }
            this.main.text_focus = 1;
          break;
    
          // DEL
          case 46 :
            //alert("DEL");
            // if (this.main.text_focus == 0)
            //   this.main.clicked_at("menubar", c_LANG_UC_BROWSING_MENUBAR[0][0][0], "delete_item", c_KEYB_MODE_NONE);
            this.main.model.delete_selected();
          break;
          
          // arrow left
          case 37 :
            // if (this.main.text_focus == 0)
            // {
            //   e.preventDefault();
            //   var curr_ul = document.getElementById(this.main.panel1_selected_items[0].gui_id + '_ul');
            //   curr_ul.style.display="none";
            // }
            this.main.model.handle_key_press("left", false);
          break;
  
          // arrow up
          case 38 : 
            // if (this.main.text_focus == 0)
            // {
            //   e.preventDefault();
            //                         // unmark all selected items
            //   var new_selected_gui_id = this.main.tree_panel.get_next_visible_up(this.main.panel1_selected_items[0].gui_id);  
            //   if (new_selected_gui_id != null)
            //   {
            //     for (var i=0; i<this.main.panel1_selected_items.length; i++)
            //       this.main.tree_panel.markup_items(this.main.panel1_selected_items[i].gui_id, false);
  
            //     this.main.panel1_selected_items = [];
            //                         // renew selection
            //     this.main.panel1_selected_items[0] = this.main.tree_panel.get_item_data(new_selected_gui_id);
            //     this.main.tree_panel.markup_items(this.main.panel1_selected_items[0].gui_id, true);                                                             
            //                         // save setup
            //     uc_browsing_setup.tree_last_selected = this.main.panel1_selected_items[0].elem_id;
            //     this.main.save_setup();                
            //                         // scroll into view
            //     document.getElementById(this.main.panel1_selected_items[0].gui_id + '_div').scrollIntoView();  // $$$
            //                         // load content
            //     this.main.content_panel.load_item_content(this.main.tree_panel.get_item_data(this.main.tree_panel.get_gui_id(uc_browsing_setup.tree_last_selected)[0]));                                    
            //   }
            //   else
            //   {
            //     this.main.select_item("tree_select", "E0", c_KEYB_MODE_NONE)
            //     document.getElementById('div_panel1_content').scrollTop = 0;
            //   }
            //   window.scrollTo(0, 0);              
            // }
            this.main.model.handle_key_press("up", false);
          break;
           
          // arrow right
          case 39 :
            // if (this.main.text_focus == 0)
            // {
            //   e.preventDefault();
            //   var curr_ul = document.getElementById(this.main.panel1_selected_items[0].gui_id + '_ul');
            //   curr_ul.style.display="block";
            // }
            this.main.model.handle_key_press("right", false);
          break;
              
          // arrow down
          case 40 : 
            // if (this.main.text_focus == 0)
            // {
            //   e.preventDefault();
  
            //   var new_selected_gui_id = this.main.tree_panel.get_next_visible_dn(this.main.panel1_selected_items[0].gui_id);  
            //   if (new_selected_gui_id != null)
            //   {
            //                         // unmark all selected items
            //     for (var i=0; i<this.main.panel1_selected_items.length; i++)
            //       this.main.tree_panel.markup_items(this.main.panel1_selected_items[i].gui_id, false);
            //     
            //     this.main.panel1_selected_items = [];
            //                         // renew selection
            //     this.main.panel1_selected_items[0] = this.main.tree_panel.get_item_data(new_selected_gui_id);
            //     this.main.tree_panel.markup_items(this.main.panel1_selected_items[0].gui_id, true);                                                             
            //                         // save setup
            //     uc_browsing_setup.tree_last_selected = this.main.panel1_selected_items[0].elem_id;
            //     this.main.save_setup();                
            //                         // scroll into view
            //     document.getElementById(this.main.panel1_selected_items[0].gui_id + '_div').scrollIntoView();  // $$$              
            //                         // load content
            //     this.main.content_panel.load_item_content(this.main.tree_panel.get_item_data(this.main.tree_panel.get_gui_id(uc_browsing_setup.tree_last_selected)[0]));
            //   }
            //   window.scrollTo(0, 0);
            // }
            this.main.model.handle_key_press("down", false);
          break;
  
          
          default : 
            break;
        }
    break;  // No extra key
  
  
    // CTRL
    case c_KEYB_MODE_CTRL_ONLY :
      if (this.main.text_focus == 0)
      {
        switch (my_key)
        {
          // CTRL + C
          case 67 : 
            //alert("CTRL-C");
            //this.main.clicked_at("menubar", c_LANG_UC_BROWSING_MENUBAR[0][0][0], "copy_item", c_KEYB_MODE_CTRL_ONLY);
            this.main.model.handle_key_press("Ctrl+C", false);
          break; 
          
          // CTRL + L
          case 76 :
            //alert("CTRL-L");
            //this.main.clicked_at("menubar", c_LANG_UC_BROWSING_MENUBAR[0][0][0], "clone_item", c_KEYB_MODE_CTRL_ONLY);
            this.main.model.handle_key_press("Ctrl+L", false);
          break;
  
          // CTRL + V
          case 86 :
            //alert("CTRL-V");
            //this.main.clicked_at("menubar", c_LANG_UC_BROWSING_MENUBAR[0][0][0], "paste_item", c_KEYB_MODE_CTRL_ONLY);
            this.main.model.handle_key_press("Ctrl+V", false);
          break;
          
          // CTRL + X
          case 88 :
            //alert("CTRL-X");
            // this.main.clicked_at("menubar", c_LANG_UC_BROWSING_MENUBAR[0][0][0], "cut_item", c_KEYB_MODE_CTRL_ONLY);
            this.main.model.handle_key_press("Ctrl+X", false);
          break;
  
          default : break;
        }
      }  
    break; // CTRL
  
    // SHIFT
    case c_KEYB_MODE_SHIFT_ONLY :
      if (this.main.text_focus == 0)
      {
        switch (my_key)
        {
          // TAB - shift item(s) one level up
          case 9 :
            //alert("ShiftTab");
                                    // cut selected items
            this.main.process_elem_menu("cut_item");
            this.main.panel1_selected_items = [];
            var myParent_obj;
            if (this.main.panel1_cut_items[0].parent_gui_id != null)
            {
              myParent_obj = this.main.tree_panel.get_item_data(this.main.panel1_cut_items[0].parent_gui_id);
              if (myParent_obj.parent_gui_id != null)
              {
                this.main.panel1_selected_items[0] = this.main.tree_panel.get_item_data(myParent_obj.parent_gui_id);
                                    // ... and paste them at grandparent
                this.main.process_elem_menu("paste_item");
                this.main.panel1_selected_items_afterop = jQuery.extend(true, [], this.main.panel1_cut_items);
              }
            }
          break;

          // arrow up
          case 38 : 
            this.main.model.handle_key_press("up", true);
          break;
                         
          // arrow down
          case 40 : 
            this.main.model.handle_key_press("down", true);
          break;
  
          default :
          break;          
        }
      }
    break; // SHIFT
  
    // ALT
    case c_KEYB_MODE_ALT_ONLY :
      if (this.main.text_focus == 0)
      {
        switch (my_key)
        {
          // ALT + N          
          case 78 :
            //alert("ALT-N");
            if (this.main.text_focus == 0)  
            {
              this.main.clicked_at("menubar", c_LANG_UC_BROWSING_MENUBAR[0][0][0], "input_item", c_KEYB_MODE_ALT_ONLY);            
            }
          break;
          
          // ALT + 0..9
          default :
            if(my_key>47 && my_key<58)
            { 
              //alert("ALT-"+(my_key-48));        
              this.main.clicked_at("menubar", c_LANG_LIB_TREE_ELEMTYPE[0][0], new String(c_LANG_LIB_TREE_ELEMTYPE[my_key-47][0]), c_KEYB_MODE_ALT_ONLY);  
            }
          break;
        }
      }
    break; // ALT
      
      
    // CTRL + Shift + ALT
    case c_KEYB_MODE_ALT_SHIFT_CTRL :
      if (this.main.text_focus == 0)
      {
        switch (my_key)
        {
          // CTRL+Shift+ALT + E
          case 69 :
            //alert("CTRL+Shift+ALT-E");
            this.main.clicked_at("menubar", c_LANG_UC_BROWSING_MENUBAR[0][0][0], "export_item", c_KEYB_MODE_ALT_SHIFT_CTRL);               
          break;
  
          // CTRL+Shift+ALT + L
          case 76 :
            //alert("CTRL+Shift+ALT+L");
            this.main.clicked_at("menubar", c_LANG_UC_BROWSING_MENUBAR[0][0][0], "lock_topic", c_KEYB_MODE_ALT_SHIFT_CTRL);               
          break; 
        
          default : break;            
        }
      }  
    break; // CTRL + Shift + ALT    
  }
}




