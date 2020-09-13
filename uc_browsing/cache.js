export function CacheManager(data_source) {
  this.cache = new Map();
  this.data_source = data_source;
  this.observers = new Set();

  this.eager_loading_list_changed = (eager_loading_list) => {
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
    this.observers.forEach(obs => obs(new_cache));
  };
  
  this.get_cache = () => {
    return new Map(this.cache);
  }
}

