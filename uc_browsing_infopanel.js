import { c_KEYB_MODE_NONE } from "./global_defs.js";
import { global_setup } from "./global_setup.js";

// Class 'uc_browsing_infopanel' -> Panel3
export function uc_browsing_infopanel(gui_headline_context, lang_headline, gui_infopanel_context, current_usecase, current_panel, dispatcher, gui_params)
{
  // save params to object
  this.gui_headline_context = gui_headline_context;
  this.lang_headline = lang_headline;
  this.gui_infopanel_context = gui_infopanel_context;
  this.current_usecase = current_usecase;
  this.current_panel = current_panel;
  this.dispatcher = dispatcher;
  this.gui_params = gui_params;

  // bind object functions
  this.print_title = uc_browsing_infopanel_print_title.bind(this);
  this.init_gui = uc_browsing_infopanel_init_gui.bind(this);
 
  // object variables


  // constructor  
  this.print_title();
  this.init_gui(this.gui_params);
}


function uc_browsing_infopanel_print_title()
{                                  
  setInnerHTML(document.getElementById(this.gui_headline_context), '<B>' + this.lang_headline[global_setup.curr_lang] + '</B>');
}


function uc_browsing_infopanel_init_gui(iparams)
{
  // iparams[].elem_id
  // iparams[].name
  // iparams[].text
  
  var container = document.getElementById(this.gui_infopanel_context);
  container.innerHTML = "";

                                    // find Menu Index of Ticker-Titles to avoid
                                    // errors when menu changes  
  var as_news_idx = -1;
  var as_dates_idx = -1;
  for (var i=0; i<c_LANG_UC_BROWSING_MENUBAR[0].length; i++)
  {
    if (c_LANG_UC_BROWSING_MENUBAR[0][i][0] == "as_news")
      as_news_idx = i;
    if (c_LANG_UC_BROWSING_MENUBAR[0][i][0] == "as_date")
      as_dates_idx = i;
  }

  if ((iparams != undefined) && (iparams != null))
  {
    // ticker 1
    append_ticker(
      container,
      this.current_panel + "_ticker1",
      c_LANG_UC_BROWSING_PANEL3_TICKER1_TITLE[global_setup.curr_lang],
      iparams[0].text != undefined
        ? iparams[0].text
        : c_LANG_TICKER_DEFAULT_TEXT[global_setup.curr_lang] + c_LANG_UC_BROWSING_MENUBAR[0][0][global_setup.curr_lang] + '\\' + c_LANG_UC_BROWSING_MENUBAR[0][as_news_idx][global_setup.curr_lang] + ' ! +++',
      iparams[0].elem_id != null
        ? () => this.dispatcher(this.current_usecase, this.current_panel, 'ticker_item_link', iparams[0].elem_id, c_KEYB_MODE_NONE)
        : null
    );

    // ticker 2
    append_ticker(
      container,
      this.current_panel + "_ticker2",
      c_LANG_UC_BROWSING_PANEL3_TICKER2_TITLE[global_setup.curr_lang],
      iparams[1].text != undefined
        ? iparams[1].text
        : c_LANG_TICKER_DEFAULT_TEXT[global_setup.curr_lang] + c_LANG_UC_BROWSING_MENUBAR[0][0][global_setup.curr_lang] + '\\' + c_LANG_UC_BROWSING_MENUBAR[0][as_news_idx][global_setup.curr_lang] + ' ! +++',
      iparams[1].elem_id != null
        ? () => this.dispatcher(this.current_usecase, this.current_panel, 'ticker_item_link', iparams[1].elem_id, c_KEYB_MODE_NONE)
        : null
    );
  }
  else
    alert(c_LANG_WARNING_WRONG_PARAM[global_setup.curr_lang] + "undefined");
}

function append_ticker(container, id, link_text, marquee_text, on_click) {
  // ticker1 - item link
  const space_elem = document.createTextNode("&nbsp;");
  const br_elem = document.createElement("br");
  const a_elem = document.createElement('a');
  a_elem.id = id + "_item_link";
  a_elem.innerHTML = link_text;
  a_elem.onclick = on_click;
  const link_elem = document.createElement('u');
  link_elem.appendChild(link);

  container.appendChild(space_elem);
  container.appendChild(link_elem);
  container.appendChild(br_elem);

  // ticker1 - text
  const marquee_elem = document.createElement("marquee");
  marquee_elem.innerHTML = '<font color="#BBBBBB"><div id="' + id + '_text">' + marquee_text + '</div></font>';
  marquee_elem.bgColor = "#BBBBBB";
  marquee_elem.scrollAmount = 2;
  marquee_elem.scrollDelay = 5;
  container.appendChild(document.createTextNode("&nbsp;"));
  container.appendChild(marquee);
  container.appendChild(document.createElement("br"));
}

