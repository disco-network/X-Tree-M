import { c_DATA_SOURCE_TYPE_ID_PAUL } from "./global_defs.js";

                                    // mother of all setups
export var c_DEFAULT_UC_BROWSING_SETUP_COOKIE = "UC_Browsing_Setup";
             
                                 
export var c_DEFAULT_UC_BROWSING_SETUP = {};                                
c_DEFAULT_UC_BROWSING_SETUP.tree_data_src_type = c_DATA_SOURCE_TYPE_ID_PAUL; 
c_DEFAULT_UC_BROWSING_SETUP.tree_data_src_path = "https://xtreem.datokrat.uber.space/api/nodes/"; 

																								//"http://xtreem.datokrat.sirius.uberspace.de/api/nodes/"; 
                                                // "local";       // "local" is always used when Database is located at same location
                                                                // as the rest of the code; otherwise use the following style : 
                                                                // "www.google.de" (no "http://" and no "/" at the end !!!)
                                                                // Is this hint out of date? -- Paul
c_DEFAULT_UC_BROWSING_SETUP.tree_data_src_params = {};
c_DEFAULT_UC_BROWSING_SETUP.tree_data_src_params.db_name = "uc_browsing_tree_db.xml";
c_DEFAULT_UC_BROWSING_SETUP.tree_data_src_params.php_name = "uc_browsing_upload.php";
c_DEFAULT_UC_BROWSING_SETUP.tree_data_src_params.root_item = "1"; //"575" // "root"; //
c_DEFAULT_UC_BROWSING_SETUP.tree_path_to_selected = [c_DEFAULT_UC_BROWSING_SETUP.tree_data_src_params.root_item];
c_DEFAULT_UC_BROWSING_SETUP.info_ticker1_item_id = null;
c_DEFAULT_UC_BROWSING_SETUP.info_ticker2_item_id = null;
c_DEFAULT_UC_BROWSING_SETUP.info_timer = 600000;                // every 10 minutes
c_DEFAULT_UC_BROWSING_SETUP.favorites = [];

export var uc_browsing_setup = jQuery.extend(true, {}, c_DEFAULT_UC_BROWSING_SETUP);

export var uc_browsing_change_permission = 0;
