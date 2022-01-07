
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.3' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/Die.svelte generated by Svelte v3.44.3 */
    const file$1 = "src/Die.svelte";

    function create_fragment$2(ctx) {
    	let div6;
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let div2;
    	let t2;
    	let div3;
    	let t3;
    	let div4;
    	let t4;
    	let div5;
    	let div6_class_value;
    	let t5;
    	let div7;

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			t1 = space();
    			div2 = element("div");
    			t2 = space();
    			div3 = element("div");
    			t3 = space();
    			div4 = element("div");
    			t4 = space();
    			div5 = element("div");
    			t5 = space();
    			div7 = element("div");
    			attr_dev(div0, "class", "face front svelte-1gp4pgj");
    			add_location(div0, file$1, 21, 1, 437);
    			attr_dev(div1, "class", "face back svelte-1gp4pgj");
    			add_location(div1, file$1, 22, 1, 469);
    			attr_dev(div2, "class", "face left svelte-1gp4pgj");
    			add_location(div2, file$1, 23, 1, 500);
    			attr_dev(div3, "class", "face right svelte-1gp4pgj");
    			add_location(div3, file$1, 24, 1, 531);
    			attr_dev(div4, "class", "face top svelte-1gp4pgj");
    			add_location(div4, file$1, 25, 1, 563);
    			attr_dev(div5, "class", "face bottom svelte-1gp4pgj");
    			add_location(div5, file$1, 26, 1, 593);
    			attr_dev(div6, "class", div6_class_value = "die " + (/*b*/ ctx[1] ? 'odd-roll' : 'even-roll') + " svelte-1gp4pgj");
    			attr_dev(div6, "data-roll", /*face*/ ctx[0]);
    			add_location(div6, file$1, 20, 0, 368);
    			attr_dev(div7, "class", "odd-roll svelte-1gp4pgj");
    			attr_dev(div7, "data-roll", /*face*/ ctx[0]);
    			add_location(div7, file$1, 28, 0, 632);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div0);
    			append_dev(div6, t0);
    			append_dev(div6, div1);
    			append_dev(div6, t1);
    			append_dev(div6, div2);
    			append_dev(div6, t2);
    			append_dev(div6, div3);
    			append_dev(div6, t3);
    			append_dev(div6, div4);
    			append_dev(div6, t4);
    			append_dev(div6, div5);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, div7, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*b*/ 2 && div6_class_value !== (div6_class_value = "die " + (/*b*/ ctx[1] ? 'odd-roll' : 'even-roll') + " svelte-1gp4pgj")) {
    				attr_dev(div6, "class", div6_class_value);
    			}

    			if (dirty & /*face*/ 1) {
    				attr_dev(div6, "data-roll", /*face*/ ctx[0]);
    			}

    			if (dirty & /*face*/ 1) {
    				attr_dev(div7, "data-roll", /*face*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(div7);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function getRandomNumber(min, max) {
    	min = Math.ceil(min);
    	max = Math.floor(max);
    	return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Die', slots, []);
    	let { face = 1 } = $$props;
    	let b = Math.random() < 0.5;

    	onMount(() => {
    		setTimeout(() => {
    			$$invalidate(1, b = !b);
    		}); // die.dataset.roll = getRandomNumber(1, 6);
    	});

    	const writable_props = ['face'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Die> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('face' in $$props) $$invalidate(0, face = $$props.face);
    	};

    	$$self.$capture_state = () => ({ onMount, face, b, getRandomNumber });

    	$$self.$inject_state = $$props => {
    		if ('face' in $$props) $$invalidate(0, face = $$props.face);
    		if ('b' in $$props) $$invalidate(1, b = $$props.b);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [face, b];
    }

    class Die extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { face: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Die",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get face() {
    		throw new Error("<Die>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set face(value) {
    		throw new Error("<Die>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const playerDice = writable([]);
    const dealerDice = writable([]);

    playerDice.subscribe((value) => {
    	console.log("Player", value);
    });
    dealerDice.subscribe((value) => {
    	console.log("Dealer", value);
    });

    /* src/Game.svelte generated by Svelte v3.44.3 */
    const file = "src/Game.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	return child_ctx;
    }

    // (188:19) 
    function create_if_block_7(ctx) {
    	let h10;
    	let t1;
    	let button;
    	let h11;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			h10 = element("h1");
    			h10.textContent = "Dealer wins!";
    			t1 = space();
    			button = element("button");
    			h11 = element("h1");
    			h11.textContent = "Reset";
    			add_location(h10, file, 188, 0, 4058);
    			add_location(h11, file, 189, 27, 4107);
    			add_location(button, file, 189, 0, 4080);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h10, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button, anchor);
    			append_dev(button, h11);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*reset*/ ctx[13], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h10);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(188:19) ",
    		ctx
    	});

    	return block;
    }

    // (185:25) 
    function create_if_block_6(ctx) {
    	let h10;
    	let t1;
    	let button;
    	let h11;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			h10 = element("h1");
    			h10.textContent = "Player wins!";
    			t1 = space();
    			button = element("button");
    			h11 = element("h1");
    			h11.textContent = "Reset";
    			add_location(h10, file, 185, 0, 3965);
    			add_location(h11, file, 186, 27, 4014);
    			add_location(button, file, 186, 0, 3987);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h10, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button, anchor);
    			append_dev(button, h11);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*reset*/ ctx[13], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h10);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(185:25) ",
    		ctx
    	});

    	return block;
    }

    // (142:0) {#if win == -1}
    function create_if_block_3(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_4, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*playerTotal*/ ctx[3] > 0) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(142:0) {#if win == -1}",
    		ctx
    	});

    	return block;
    }

    // (170:6) {:else}
    function create_else_block_1(ctx) {
    	let h2;
    	let h10;
    	let t1;
    	let t2;
    	let h3;
    	let t4;
    	let ul;
    	let li0;
    	let t8;
    	let li1;
    	let t10;
    	let li2;
    	let t14;
    	let li3;
    	let t18;
    	let button;
    	let h11;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h10 = element("h1");
    			h10.textContent = "DiceJack";
    			t1 = text("\n\t- “BlackJack, but with dice”");
    			t2 = space();
    			h3 = element("h3");
    			h3.textContent = "Rules:";
    			t4 = space();
    			ul = element("ul");
    			li0 = element("li");
    			li0.textContent = `Player must get a higher total than dealer without going over ${limit}!`;
    			t8 = space();
    			li1 = element("li");
    			li1.textContent = "The dealer will hit till he gets 12 or higher!";
    			t10 = space();
    			li2 = element("li");
    			li2.textContent = `The player wins if dealer goes over ${limit}!`;
    			t14 = space();
    			li3 = element("li");
    			li3.textContent = `The dealer wins if player goes over ${limit} or ties!`;
    			t18 = space();
    			button = element("button");
    			h11 = element("h1");
    			h11.textContent = "Play";
    			add_location(h10, file, 171, 1, 3551);
    			add_location(h2, file, 170, 0, 3545);
    			add_location(h3, file, 175, 0, 3606);
    			add_location(li0, file, 177, 1, 3628);
    			add_location(li1, file, 178, 1, 3709);
    			add_location(li2, file, 179, 1, 3766);
    			add_location(li3, file, 180, 1, 3821);
    			add_location(ul, file, 176, 0, 3622);
    			add_location(h11, file, 183, 26, 3916);
    			add_location(button, file, 183, 0, 3890);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			append_dev(h2, h10);
    			append_dev(h2, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, ul, anchor);
    			append_dev(ul, li0);
    			append_dev(ul, t8);
    			append_dev(ul, li1);
    			append_dev(ul, t10);
    			append_dev(ul, li2);
    			append_dev(ul, t14);
    			append_dev(ul, li3);
    			insert_dev(target, t18, anchor);
    			insert_dev(target, button, anchor);
    			append_dev(button, h11);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*play*/ ctx[10], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(ul);
    			if (detaching) detach_dev(t18);
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(170:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (142:16) {#if playerTotal > 0}
    function create_if_block_4(ctx) {
    	let h1;
    	let t1;
    	let ul;
    	let t2;
    	let h3;
    	let t3;
    	let t4;
    	let t5;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	let each_value_1 = /*$playerDice*/ ctx[8];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const if_block_creators = [create_if_block_5, create_else_block];
    	const if_blocks = [];

    	function select_block_type_2(ctx, dirty) {
    		if (/*dealerTotal*/ ctx[4] > 0) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_2(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Player Dice Rolls:";
    			t1 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			h3 = element("h3");
    			t3 = text("Total: ");
    			t4 = text(/*playerTotal*/ ctx[3]);
    			t5 = space();
    			if_block.c();
    			if_block_anchor = empty();
    			add_location(h1, file, 143, 0, 3049);
    			attr_dev(ul, "class", "wrap svelte-4zy7kh");
    			add_location(ul, file, 144, 0, 3077);
    			add_location(h3, file, 151, 0, 3162);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			insert_dev(target, t2, anchor);
    			insert_dev(target, h3, anchor);
    			append_dev(h3, t3);
    			append_dev(h3, t4);
    			insert_dev(target, t5, anchor);
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$playerDice*/ 256) {
    				each_value_1 = /*$playerDice*/ ctx[8];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(ul, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (!current || dirty & /*playerTotal*/ 8) set_data_dev(t4, /*playerTotal*/ ctx[3]);
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_2(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(ul);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t5);
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(142:16) {#if playerTotal > 0}",
    		ctx
    	});

    	return block;
    }

    // (146:1) {#each $playerDice as die}
    function create_each_block_1(ctx) {
    	let die;
    	let current;

    	die = new Die({
    			props: { face: /*die*/ ctx[15] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(die.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(die, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const die_changes = {};
    			if (dirty & /*$playerDice*/ 256) die_changes.face = /*die*/ ctx[15];
    			die.$set(die_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(die.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(die.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(die, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(146:1) {#each $playerDice as die}",
    		ctx
    	});

    	return block;
    }

    // (165:0) {:else}
    function create_else_block(ctx) {
    	let button0;
    	let h10;
    	let button0_disabled_value;
    	let t1;
    	let button1;
    	let h11;
    	let button1_disabled_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			h10 = element("h1");
    			h10.textContent = "Hit";
    			t1 = space();
    			button1 = element("button");
    			h11 = element("h1");
    			h11.textContent = "Keep";
    			add_location(h10, file, 166, 58, 3426);
    			button0.disabled = button0_disabled_value = /*playerTotal*/ ctx[3] > limit;
    			add_location(button0, file, 166, 0, 3368);
    			add_location(h11, file, 167, 59, 3507);
    			button1.disabled = button1_disabled_value = /*playerTotal*/ ctx[3] > limit;
    			add_location(button1, file, 167, 0, 3448);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button0, anchor);
    			append_dev(button0, h10);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button1, anchor);
    			append_dev(button1, h11);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*hit*/ ctx[11], false, false, false),
    					listen_dev(button1, "click", /*keep*/ ctx[12], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*playerTotal*/ 8 && button0_disabled_value !== (button0_disabled_value = /*playerTotal*/ ctx[3] > limit)) {
    				prop_dev(button0, "disabled", button0_disabled_value);
    			}

    			if (dirty & /*playerTotal*/ 8 && button1_disabled_value !== (button1_disabled_value = /*playerTotal*/ ctx[3] > limit)) {
    				prop_dev(button1, "disabled", button1_disabled_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(165:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (153:0) {#if dealerTotal > 0}
    function create_if_block_5(ctx) {
    	let h1;
    	let t1;
    	let ul;
    	let t2;
    	let h3;
    	let t3;
    	let t4;
    	let current;
    	let each_value = /*$dealerDice*/ ctx[9];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Dealer Dice Rolls:";
    			t1 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			h3 = element("h3");
    			t3 = text("Total: ");
    			t4 = text(/*dealerTotal*/ ctx[4]);
    			add_location(h1, file, 154, 0, 3215);
    			attr_dev(ul, "class", "wrap svelte-4zy7kh");
    			add_location(ul, file, 155, 0, 3243);
    			add_location(h3, file, 162, 0, 3328);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			insert_dev(target, t2, anchor);
    			insert_dev(target, h3, anchor);
    			append_dev(h3, t3);
    			append_dev(h3, t4);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$dealerDice*/ 512) {
    				each_value = /*$dealerDice*/ ctx[9];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(ul, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (!current || dirty & /*dealerTotal*/ 16) set_data_dev(t4, /*dealerTotal*/ ctx[4]);
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(ul);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(h3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(153:0) {#if dealerTotal > 0}",
    		ctx
    	});

    	return block;
    }

    // (157:1) {#each $dealerDice as die}
    function create_each_block(ctx) {
    	let die;
    	let current;

    	die = new Die({
    			props: { face: /*die*/ ctx[15] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(die.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(die, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const die_changes = {};
    			if (dirty & /*$dealerDice*/ 512) die_changes.face = /*die*/ ctx[15];
    			die.$set(die_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(die.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(die.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(die, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(157:1) {#each $dealerDice as die}",
    		ctx
    	});

    	return block;
    }

    // (194:0) {#if drig}
    function create_if_block_2(ctx) {
    	let a;

    	const block = {
    		c: function create() {
    			a = element("a");
    			attr_dev(a, "class", "green svelte-4zy7kh");
    			add_location(a, file, 194, 1, 4151);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(194:0) {#if drig}",
    		ctx
    	});

    	return block;
    }

    // (198:0) {#if prig}
    function create_if_block_1(ctx) {
    	let a;

    	const block = {
    		c: function create() {
    			a = element("a");
    			attr_dev(a, "class", "red svelte-4zy7kh");
    			add_location(a, file, 198, 1, 4192);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(198:0) {#if prig}",
    		ctx
    	});

    	return block;
    }

    // (202:0) {#if info}
    function create_if_block(ctx) {
    	let p;
    	let t0;
    	let t1;
    	let t2;
    	let t3;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("Dealer: ");
    			t1 = text(/*dealerWinCount*/ ctx[6]);
    			t2 = text(" / ");
    			t3 = text(/*total*/ ctx[7]);
    			add_location(p, file, 202, 1, 4231);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    			append_dev(p, t2);
    			append_dev(p, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*dealerWinCount*/ 64) set_data_dev(t1, /*dealerWinCount*/ ctx[6]);
    			if (dirty & /*total*/ 128) set_data_dev(t3, /*total*/ ctx[7]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(202:0) {#if info}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let current_block_type_index;
    	let if_block0;
    	let t0;
    	let t1;
    	let t2;
    	let if_block3_anchor;
    	let current;
    	const if_block_creators = [create_if_block_3, create_if_block_6, create_if_block_7];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*win*/ ctx[5] == -1) return 0;
    		if (/*win*/ ctx[5] == 0) return 1;
    		if (/*win*/ ctx[5] == 1) return 2;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	let if_block1 = /*drig*/ ctx[0] && create_if_block_2(ctx);
    	let if_block2 = /*prig*/ ctx[1] && create_if_block_1(ctx);
    	let if_block3 = /*info*/ ctx[2] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			t2 = space();
    			if (if_block3) if_block3.c();
    			if_block3_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, t0, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, t1, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert_dev(target, t2, anchor);
    			if (if_block3) if_block3.m(target, anchor);
    			insert_dev(target, if_block3_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block0) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block0 = if_blocks[current_block_type_index];

    					if (!if_block0) {
    						if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block0.c();
    					} else {
    						if_block0.p(ctx, dirty);
    					}

    					transition_in(if_block0, 1);
    					if_block0.m(t0.parentNode, t0);
    				} else {
    					if_block0 = null;
    				}
    			}

    			if (/*drig*/ ctx[0]) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block_2(ctx);
    					if_block1.c();
    					if_block1.m(t1.parentNode, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*prig*/ ctx[1]) {
    				if (if_block2) ; else {
    					if_block2 = create_if_block_1(ctx);
    					if_block2.c();
    					if_block2.m(t2.parentNode, t2);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (/*info*/ ctx[2]) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);
    				} else {
    					if_block3 = create_if_block(ctx);
    					if_block3.c();
    					if_block3.m(if_block3_anchor.parentNode, if_block3_anchor);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(t0);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(t1);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach_dev(t2);
    			if (if_block3) if_block3.d(detaching);
    			if (detaching) detach_dev(if_block3_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const limit = 14;
    const dealerLimit = 11;
    const drigKey = 'KeyL';
    const prigKey = 'KeyP';
    const infoKey = 'KeyI';

    function getRandomIntInclusive(min, max) {
    	min = Math.ceil(min);
    	max = Math.floor(max);
    	return Math.floor(Math.random() * (max - min + 1) + min);
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $playerDice;
    	let $dealerDice;
    	validate_store(playerDice, 'playerDice');
    	component_subscribe($$self, playerDice, $$value => $$invalidate(8, $playerDice = $$value));
    	validate_store(dealerDice, 'dealerDice');
    	component_subscribe($$self, dealerDice, $$value => $$invalidate(9, $dealerDice = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Game', slots, []);
    	let drig = false;
    	let prig = false;
    	let info = false;
    	let playerTotal = -1;
    	let dealerTotal = -1;
    	let win = -1;
    	let dealerWinCount = 0;
    	let total = 0;

    	onMount(() => {
    		document.addEventListener('keyup', e => {
    			switch (e.code) {
    				case drigKey:
    					$$invalidate(0, drig = !drig);
    					break;
    				case prigKey:
    					$$invalidate(1, prig = !prig);
    					break;
    				case infoKey:
    					$$invalidate(2, info = !info);
    					break;
    			}
    		});
    	});

    	playerDice.subscribe(value => {
    		if (value.length > 0) $$invalidate(3, playerTotal = value.reduce((t, x) => t + x));
    	});

    	dealerDice.subscribe(value => {
    		if (value.length > 0) $$invalidate(4, dealerTotal = value.reduce((t, x) => t + x));
    	});

    	function play() {
    		let value = get_store_value(playerDice);

    		if (prig) {
    			value.push(getRandomIntInclusive(3, 5));
    			value.push(getRandomIntInclusive(4, 6));
    		} else {
    			value.push(getRandomIntInclusive(1, 6));
    			value.push(getRandomIntInclusive(1, 6));
    		}

    		playerDice.set(value);
    	}

    	function hit() {
    		let value = get_store_value(playerDice);

    		if (prig) {
    			value.push(limit - value.reduce((t, x) => t + x));
    		} else {
    			value.push(getRandomIntInclusive(1, 6));
    		}

    		playerDice.set(value);

    		setTimeout(
    			() => {
    				if (playerTotal > limit) {
    					//Dealer wins!
    					$$invalidate(5, win = 1);
    				}
    			},
    			1500
    		);
    	}

    	function dealerHit(value) {
    		setTimeout(
    			() => {
    				if (drig) {
    					value.push(limit - value.reduce((t, x) => t + x));
    				} else {
    					value.push(getRandomIntInclusive(1, 6));
    				}

    				dealerDice.set(value);

    				if (value.reduce((t, x) => t + x) <= playerTotal && value.reduce((t, x) => t + x) <= dealerLimit) {
    					dealerHit(value);
    				} else {
    					setTimeout(
    						() => {
    							if (dealerTotal > limit) {
    								$$invalidate(5, win = 0);
    							} else if (dealerTotal == limit || dealerTotal > playerTotal || dealerTotal == playerTotal) {
    								$$invalidate(5, win = 1);
    							} else {
    								$$invalidate(5, win = 0);
    							}
    						},
    						1500
    					);
    				}
    			},
    			1000
    		);
    	}

    	function keep() {
    		let value = [];

    		if (drig) {
    			value.push(getRandomIntInclusive(4, 6));
    			value.push(getRandomIntInclusive(4, 5));
    		} else {
    			value.push(getRandomIntInclusive(1, 6));
    			value.push(getRandomIntInclusive(1, 6));
    		}

    		dealerDice.set(value);

    		if (value.reduce((t, x) => t + x) <= dealerLimit) {
    			dealerHit(value);
    		} else {
    			setTimeout(
    				() => {
    					if (dealerTotal > limit) {
    						$$invalidate(5, win = 0);
    					} else if (dealerTotal == limit || dealerTotal > playerTotal || dealerTotal == playerTotal) {
    						$$invalidate(5, win = 1);
    					} else {
    						$$invalidate(5, win = 0);
    					}
    				},
    				1500
    			);
    		}
    	}

    	function reset() {
    		playerDice.set([]);
    		dealerDice.set([]);
    		$$invalidate(3, playerTotal = -1);
    		$$invalidate(4, dealerTotal = -1);
    		$$invalidate(6, dealerWinCount += win);
    		$$invalidate(7, total++, total);
    		$$invalidate(5, win = -1);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Game> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		Die,
    		playerDice,
    		dealerDice,
    		get: get_store_value,
    		limit,
    		dealerLimit,
    		drigKey,
    		prigKey,
    		infoKey,
    		drig,
    		prig,
    		info,
    		playerTotal,
    		dealerTotal,
    		win,
    		dealerWinCount,
    		total,
    		getRandomIntInclusive,
    		play,
    		hit,
    		dealerHit,
    		keep,
    		reset,
    		$playerDice,
    		$dealerDice
    	});

    	$$self.$inject_state = $$props => {
    		if ('drig' in $$props) $$invalidate(0, drig = $$props.drig);
    		if ('prig' in $$props) $$invalidate(1, prig = $$props.prig);
    		if ('info' in $$props) $$invalidate(2, info = $$props.info);
    		if ('playerTotal' in $$props) $$invalidate(3, playerTotal = $$props.playerTotal);
    		if ('dealerTotal' in $$props) $$invalidate(4, dealerTotal = $$props.dealerTotal);
    		if ('win' in $$props) $$invalidate(5, win = $$props.win);
    		if ('dealerWinCount' in $$props) $$invalidate(6, dealerWinCount = $$props.dealerWinCount);
    		if ('total' in $$props) $$invalidate(7, total = $$props.total);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		drig,
    		prig,
    		info,
    		playerTotal,
    		dealerTotal,
    		win,
    		dealerWinCount,
    		total,
    		$playerDice,
    		$dealerDice,
    		play,
    		hit,
    		keep,
    		reset
    	];
    }

    class Game extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Game",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.44.3 */

    function create_fragment(ctx) {
    	let game;
    	let current;
    	game = new Game({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(game.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(game, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(game.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(game.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(game, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Game });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		limit: 15,
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
