// packages/shared/src/index.ts
function isObject(value) {
  return value !== null && typeof value === "object";
}

// packages/reactivity/src/effect.ts
function effect(fn, options = {}) {
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run();
  });
  _effect.run();
  return _effect;
}
var activeEffect = null;
var ReactiveEffect = class {
  // 表示默认创建的effect就是响应式对象
  // fn 就是用户传递的函数 如果fn中依赖的数据发生变化后，需要重新调度-> run()
  // scheduler 就是调度函数
  constructor(fn, scheduler) {
    this.fn = fn;
    this.scheduler = scheduler;
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
      return this.fn();
    } finally {
      activeEffect = lastEffect;
    }
  }
  stop() {
    this.active = false;
  }
};

// packages/reactivity/src/reactiveEffect.ts
function track(target, p) {
  if (!activeEffect) {
    return;
  }
  console.log(activeEffect, p);
}

// packages/reactivity/src/baseHandler.ts
var multableHandlers = {
  // 收集依赖 target目标对象， p属性， receiver代理对象
  get(target, p, receiver) {
    if (p === "__v_isReactive" /* IS_REACTIVE */) {
      return true;
    }
    track(target, p);
    return Reflect.get(target, p, receiver);
  },
  set(target, p, newValue, receiver) {
    return Reflect.set(target, p, newValue, receiver);
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
export {
  activeEffect,
  effect,
  reactive
};
//# sourceMappingURL=reactivity.js.map
