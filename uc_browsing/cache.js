export function CacheManager(data_source) {
  this.cache = new Map();
  this.newest_cache = new Map();
  this.data_source = data_source;
  this.observers = new Set();
  this.eager_loading_list = [];

  this.start_continuous_reloading = () => {
    setTimeout(() => {
      this.eager_loading_list_changed(this.eager_loading_list);
      this.start_continuous_reloading();
    }, 5000);
  };

  this.eager_loading_list_changed = (eager_loading_list) => {
    this.eager_loading_list = eager_loading_list;
    eager_loading_list.forEach((entry) => {
      this.data_source
        .req_tree({ ids: entry.ids, depth: entry.depth })
        .then((nodes) => this.update(nodes));
    });
  };

  this.subscribe = (obs) => {
    this.observers.add(obs);
    return () => {
      this.observers.delete(obs);
    };
  };

  this.update = (new_nodes) => {
    let did_change = false;

    new_nodes.forEach((new_node) => {
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

      if (!this.newest_cache.has(id)) {
        this.newest_cache.set(id, {
          ...new_node,
          child_links:
            new_node.child_links !== null ? [...new_node.child_links] : null,
        });
        did_change = true;
      } else {
        const node = this.newest_cache.get(id);
        this.newest_cache.set(id, {
          ...new_node,
          child_links:
            new_node.child_links !== null
              ? [...new_node.child_links]
              : node.child_links !== null
              ? [...node.child_links]
              : null,
        });

        if (!this._are_nodes_equal(node, this.newest_cache.get(id))) {
          did_change = true;
        }
      }
    });

    if (!did_change) return;

    this.notify_observers();
  };

  this._are_nodes_equal = (first, second) => {
    return (
      first.elem_id === second.elem_id &&
      first.name === second.name &&
      first.description === second.description &&
      first.type === second.type &&
      this._are_children_of_nodes_equal(first, second)
    );
  };

  this._are_children_of_nodes_equal = (first, second) => {
    const first_links = first.child_links;
    const second_links = second.child_links;

    if (first_links === null || second_links === null) {
      return first_links === second_links;
    }

    return (
      first_links.length === second_links.length &&
      first_links.every((link, i) => link.child_id === second_links[i].child_id)
    );
  };

  this.notify_observers = () =>
    this.observers.forEach((obs) => obs(this.get_cache()));

  this.get_cache = () => {
    return new Map(this.cache);
  };

  this.get_newest_cache = () => {
    return new Map(this.newest_cache);
  };

  this.create_tree_item = ({ parent_elem_id, name, type, cb_success }) => {
    this.data_source.create_tree_item({
      parent_elem_id,
      name,
      type,
      cb_success: (id) => {
        this.cache.clear();
        this.newest_cache.clear();
        this.notify_observers();
        this.eager_loading_list_changed(this.eager_loading_list); // reload
        cb_success(id);
      },
    });
  };

  this.delete_tree_item = ({ links, cb_success }) => {
    this.data_source.delete_tree_item({
      links,
      cb_success: () => {
        this.cache.clear();
        this.newest_cache.clear();
        this.notify_observers();
        this.eager_loading_list_changed(this.eager_loading_list);
        cb_success();
      },
    });
  };

  this.change_tree_item_field = ({
    elem_id,
    field_id,
    content,
    cb_success,
  }) => {
    this.data_source.change_tree_item_field({
      elem_id,
      field_id,
      content,
      cb_success: () => {
        this.cache.clear();
        this.newest_cache.clear();
        this.notify_observers();
        this.eager_loading_list_changed(this.eager_loading_list);
        cb_success();
      },
    });
  };

  this.copy_items = ({ src_ids, target_id, cb_success }) => {
    this.data_source.copy_items({
      src_ids,
      target_id,
      cb_success: () => {
        this.cache.clear();
        this.newest_cache.clear();
        this.notify_observers();
        this.eager_loading_list_changed(this.eager_loading_list);
        cb_success();
      },
    });
  };

  this.move_items = ({ sources, target_id, cb_success }) => {
    this.data_source.move_items({
      sources,
      target_id,
      cb_success: () => {
        this.cache.clear();
        this.newest_cache.clear();
        this.notify_observers();
        this.eager_loading_list_changed(this.eager_loading_list);
        cb_success();
      },
    });
  };
}
