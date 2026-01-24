// packages/shared/src/index.ts
function isObject(value) {
  return value !== null && typeof value === "object";
}

// packages/reactivity/src/effect.ts
function effect(fn, options) {
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run();
  });
  _effect.run();
  if (options) {
    console.log("options", options);
    Object.assign(_effect, options);
  }
  const runner = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
}
var activeEffect = null;
function preCleanEffect(effect2) {
  effect2._depsLength = 0;
  effect2._trackId++;
}
function postCleanEffect(effect2) {
  if (effect2.deps.length > effect2._depsLength) {
    for (let i = effect2._depsLength; i < effect2.deps.length; i++) {
      cleanDepEffect(effect2, effect2.deps[i]);
    }
    effect2.deps.length = effect2._depsLength;
  }
}
var ReactiveEffect = class {
  // 表示默认创建的effect就是响应式对象
  // fn 就是用户传递的函数 如果fn中依赖的数据发生变化后，需要重新调度-> run()
  // scheduler 就是调度函数
  constructor(fn, scheduler) {
    this.fn = fn;
    this.scheduler = scheduler;
    this._trackId = 0;
    // 表示当前effect执行了几次
    this.deps = [];
    // 表示当前effect 依赖了哪些属性依赖
    this._depsLength = 0;
    // 表示当前effect 依赖了多少个属性依赖
    this._running = 0;
    // 表示当前effect 是否正在执行中
    this.active = true;
    this.fn = fn;
  }
  run() {
    if (!this.active) {
      return this.fn();
    }
    let lastEffect = activeEffect;
    try {
      activeEffect = this;
      preCleanEffect(this);
      this._running++;
      return this.fn();
    } finally {
      this._running--;
      postCleanEffect(this);
      activeEffect = lastEffect;
    }
  }
  stop() {
    this.active = false;
  }
};
function cleanDepEffect(effect2, dep) {
  dep.delete(effect2);
  if (dep.size === 0) {
    dep.cleanup();
  }
}
function trackEffect(dep, effect2) {
  if (dep.get(effect2) !== effect2._trackId) {
    dep.set(effect2, effect2._trackId);
    let oldDep = effect2.deps[effect2._depsLength];
    if (oldDep !== dep) {
      if (oldDep) {
        cleanDepEffect(effect2, oldDep);
      }
      effect2.deps[effect2._depsLength++] = dep;
    } else {
      effect2._depsLength++;
    }
    return;
  }
}
function triggerEffect(dep) {
  for (let effect2 of dep.keys()) {
    console.log("effect", effect2);
    if (effect2.scheduler) {
      if (!effect2._running) {
        effect2.scheduler();
      }
    }
  }
}

// packages/reactivity/src/reactiveEffect.ts
var targetMap = /* @__PURE__ */ new WeakMap();
var createDep = (cleanup, key) => {
  const dep = /* @__PURE__ */ new Map();
  dep.cleanup = cleanup;
  dep.name = key;
  return dep;
};
function track(target, p) {
  if (!activeEffect) {
    return;
  }
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
  }
  let dep = depsMap.get(p);
  if (!dep) {
    depsMap.set(p, dep = createDep(() => depsMap.delete(p), p));
  }
  trackEffect(dep, activeEffect);
  console.log("targetMap", targetMap);
}
function trigger(target, p, newValue, oldValue) {
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  let dep = depsMap.get(p);
  if (!dep) {
    return;
  }
  triggerEffect(dep);
}

// packages/reactivity/src/baseHandler.ts
var multableHandlers = {
  // 收集依赖 target目标对象， p属性， receiver代理对象
  get(target, p, receiver) {
    if (p === "__v_isReactive" /* IS_REACTIVE */) {
      return true;
    }
    track(target, p);
    let res = Reflect.get(target, p, receiver);
    if (isObject(res)) {
      return reactive(res);
    }
    return res;
  },
  set(target, p, newValue, receiver) {
    let oldValue = target[p];
    let result = Reflect.set(target, p, newValue, receiver);
    if (oldValue !== newValue) {
      trigger(target, p, newValue, oldValue);
    }
    return result;
  }
};

// packages/reactivity/src/reactive.ts
var reactiveMap = /* @__PURE__ */ new WeakMap();
var createReactiveObject = (target) => {
  if (!isObject(target)) {
    return target;
  }
  if (target["__v_isReactive" /* IS_REACTIVE */]) {
    return target;
  }
  const existingProxy = reactiveMap.get(target);
  if (existingProxy) {
    return existingProxy;
  }
  let proxy = new Proxy(target, multableHandlers);
  reactiveMap.set(target, proxy);
  return proxy;
};
function reactive(target) {
  return createReactiveObject(target);
}
function toReactive(value) {
  return isObject(value) ? reactive(value) : value;
}

// packages/reactivity/src/ref.ts
function ref(value) {
  return createRef(value);
}
function createRef(value) {
  return new RefImpl(value);
}
var RefImpl = class {
  // 用于收集对应的effect
  constructor(rawValue) {
    this.rawValue = rawValue;
    this.__v_isRef = true;
    this._value = toReactive(rawValue);
  }
  // 类的属性访问器
  get value() {
    trackRefValue(this);
    return this._value;
  }
  set value(newVal) {
    if (newVal !== this.rawValue) {
      this.rawValue = newVal;
      this._value = newVal;
      triggerRefValue(this);
    }
  }
};
function trackRefValue(ref2) {
  if (activeEffect) {
    trackEffect(
      ref2.dep = createDep(() => ref2.dep = void 0, "undefined"),
      activeEffect
    );
  }
}
function triggerRefValue(ref2) {
  let dep = ref2.dep;
  if (dep) {
    triggerEffect(dep);
  }
}
export {
  activeEffect,
  effect,
  reactive,
  ref,
  toReactive,
  trackEffect,
  triggerEffect
};
//# sourceMappingURL=reactivity.js.map
