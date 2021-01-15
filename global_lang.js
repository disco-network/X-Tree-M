// Attention ! Don't change the order of the entries and don't 
// delete / enter a new item at the beginning or inbetween since
// this can lead to inconsistency with the database (except most of
// the menus)
 

export var c_LANG = ["Internal", "English", "German"];
export var c_LANG_DEFAULT = 1;  // English = 1

 

export var c_LANG_TICKER_DEFAULT_TEXT = 
      ["do_nothing"           ,"+++ No information source selected ! +++ Please select the proper item in the tree and choose ", "+++ Keine Informationsquelle ausgew�hlt ! +++ Bitte klicken Sie auf das passende Element im Baum und w�hlen Sie "];

export var c_LANG_MSG_LOADING = 
[     "do_nothing"           ,"Loading Data. Please wait ..."           , "Daten werden geladen. Bitte warten ..."];

export var c_LANG_WARNING_PARENT_MISSING = 
[     "do_nothing"           ,"Parent item doesn't exist !"             , "Das Eltern-Element existiert nicht !"];

export var c_LANG_WARNING_CURRENT_MISSING = 
[     "do_nothing"           ,"Current item doesn't exist !"            , "Das aktuelle Element existiert nicht !"];

export var c_LANG_WARNING_FIELD_REDUNDANCE = 
[     "do_nothing"           ,"Redundant field : "                      , "Doppelt verwendetes Feld : "];

export var c_LANG_MSG_FIELD_CREATED = 
[     "do_nothing"           ,"Field created : "                        , "Neu erzeugtes Feld : "];

export var c_LANG_WARNING_ITEM_MISSING = 
[     "do_nothing"           ,"Item missing : "                         , "Fehlendes Element : "];

export var c_LANG_WARNING_SINGLE_ITEM_NEEDED = 
[     "do_nothing"           ,"Exactly one item has to be selected for this operation !", "Genau ein Element mu� f�r diesen Befehl ausgew�hlt sein !"];

export var c_LANG_WARNING_NOTHING_SELECTED = 
[     "do_nothing"           ,"Nothing selected !"                      , "Kein Element ausgew�hlt !"];

export var c_LANG_WARNING_NOTHING_IN_MEMORY = 
[     "do_nothing"           ,"Nothing in memory !"                     , "Zwischenspeicher leer !"];

export var c_LANG_WARNING_WRONG_SELECTION = 
[     "do_nothing"           ,"Wrong selection !"                       , "Falsche Auswahl !"];

export var c_LANG_WARNING_CYCLE_DETECTED = 
[     "do_nothing"           ,"Operation blocked due to cycle !"        , "Befehl blockiert wegen drohendem Zyklus !"];

export var c_LANG_WARNING_WRONG_PARAM =
[     "do_nothing"          ,"Wrong parameter : ",                      , "Falscher Parameter : "];

export var c_LANG_MSG_SETUP_SRC_COOKIE_CREATED =
[
      "do_nothing",
      "Created Cookie to save the Global Setup source. Use Setup\Setup Source for alternative settings !",
      "Cookie mit dem Pfad zu den globalen Einstellungen angelegt. Nutzen Sie Einstellungen\Pfad zu Einstellungen, um das zu �ndern !"
];

export var c_LANG_MSG_COOKIES_INACTIVE = 
[     "do_nothing"          ,"Cookies not active. Loading Default Setup Path !", "Cookies sind nicht aktiviert. Lade Setup vom Standard Setup-Pfad !"];

export var c_LANG_MSG_SETUP_LOADING_FAILED =
[
      "do_nothing"          ,
      "Setup loading failed. Using Default Values. Enable Cookies and use Setup\Setup Source for alternative settings !",
      "Laden der Einstellungen fehlgeschlagen. Es werden die Standard-Einstellungen verwendet. Aktivieren Sie Cookies und nutzen Sie Einstellungen\Pfad zu Einstellungen um das zu �ndern !"
];

export var c_LANG_MSG_INVALID_SETUP_SOURCE_TYPE =
[
      "do_nothing"          ,
      "Found invalid Setup Source Type. Please setup a different one using Setup\Setup Source. Make sure that Cookies are enabled ! ",
      "Ung�ltigen Speicherort f�r globale Einstellungen gefunden. Aktivieren Sie Cookies und nutzen Sie Einstellungen\Pfad zu Einstellungen um das zu �ndern !"
];


// =================================================================================================================

// To test if all Arrays are complete you can put them together in a global 2-d or 3-d Array by using the concat 
// function and check if all lines have as many entries as the Array c_LANG.
