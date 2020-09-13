export function CacheManager(data_source) {
  this.cache = new Map();
  this.data_source = data_source;
  this.observers = new Set();
  this.eager_loading_list = [];

  this.eager_loading_list_changed = (eager_loading_list) => {
    this.eager_loading_list = eager_loading_list;
    eager_loading_list.forEach(entry => {
      this.data_source.req_tree({ids: entry.ids, depth: entry.depth})
        .then(nodes => this.update(nodes));
    });
  };

  this.subscribe = obs => {
    this.observers.add(obs);
    return () => {
      this.observers.delete(obs);
    };
  }

  this.update = (new_nodes) => {
    let did_change = false;

    new_nodes.forEach(new_node => {
      const id = new_node.elem_id;
      if (!this.cache.has(id)) {
        this.cache.set(id, new_node);
        did_change = true;
      } else {
        const node = this.cache.get(id);
        if (node.child_links === null && new_node.child_links !== null) {
          node.child_links = new_node.child_links;
          did_change = true;
        }
      }
    });

    if (!did_change) return;

    const new_cache = this.get_cache();
    this.notify_observers();
  };

  this.notify_observers = () => this.observers.forEach(obs => obs(this.get_cache()));
  
  this.get_cache = () => {
    return new Map(this.cache);
  }

  this.create_tree_item = ({parent_elem_id, name, type, cb_success}) => {
    this.data_source.create_tree_item({parent_elem_id, name, type, cb_success: id => {
      this.cache.clear();
      this.notify_observers();
      this.eager_loading_list_changed(this.eager_loading_list); // reload
      cb_success(id);
    }});
  };

  this.delete_tree_item = ({links, cb_success}) => {
    this.data_source.delete_tree_item({links, cb_success: () => {
      this.cache.clear();
      this.notify_observers();
      this.eager_loading_list_changed(this.eager_loading_list);
      cb_success();
    }});
  };

  this.change_tree_item_field = ({ elem_id, field_id, content, cb_success }) => {
    this.data_source.change_tree_item_field({ elem_id, field_id, content, cb_success: () => {
      this.cache.clear();
      this.notify_observers();
      this.eager_loading_list_changed(this.eager_loading_list);
      cb_success();
    }});
  };
}

