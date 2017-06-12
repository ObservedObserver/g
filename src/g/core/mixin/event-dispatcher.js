const Util = require('../../../util/index');
const Event = require('@ali/g-event');

module.exports = {
  /**
   * 事件分发器的处理函数
   */
  initEventDispatcher() {
    this.__listeners = {};
  },
  /**
   * 为对象注册事件
   * @param  {String} type 事件类型
   * @param  {Function} listener 回调函数
   * @return {Object} this
   */
  on(type, listener) {
    const listeners = this.__listeners;

    if (Util.isNil(listeners[type])) {
      listeners[type] = [];
    }

    if (listeners[type].indexOf(listener) === -1) {
      listeners[type].push(listener);
    }
    return this;
  },
  /**
   * 为对象取消事件回调
   * 三个模式
   * 模式1: 没有参数的时候，取消所有回调处理函数
   * 模式2: 只有type的时候，取消所有type的回调类别
   * 模式3: 同时具有type, listener参数时，只取消type中listener对应的回调
   * @param  {String} type 事件类型
   * @param  {Function} listener 回调函数
   * @return {Object} this
   */
  off(type, listener) {
    const listeners = this.__listeners;
    if (arguments.length === 0) {
      this.__listeners = {};
      return this;
    }

    if (arguments.length === 1 && Util.isString(type)) {
      listeners[type] = [];
      return this;
    }

    if (arguments.length === 2 && Util.isString(type) && Util.isFunction(listener)) {
      Util.remove(listeners[type], listener);
      return this;
    }
  },
  /**
   * 判断某个listener是否是当前对象的回调函数
   * @param  {String} type 事件类型
   * @param  {Function} listener 回调函数
   * @return {Object} this
   */
  has(type, listener) {
    const listeners = this.__listeners;

    if (arguments.length === 0) {
      if (!Util.isEmpty(listeners)) {
        return true;
      }
    }

    if (arguments.length === 1) {
      if (listeners[type] && !Util.isEmpty(listeners[type])) {
        return true;
      }
    }

    if (arguments.length === 2) {
      if (listeners[type] && listeners[type].indexOf(listener) !== -1) {
        return true;
      }
    }

    return false;
  },
  trigger(event) {
    const self = this;
    const listeners = self.__listeners;
    const listenersArray = listeners[event.type];
    event.target = self;
    if (!Util.isNil(listenersArray)) {
      listenersArray.forEach(function(listener) {
        listener.call(self, event);
      });
    }
    if (event.bubbles) {
      const parent = self.get('parent');
      if (parent && !event.propagationStopped) {
        parent.trigger(event);
      }
    }
    return self;
  },
  /**
   * fire the event
   * @param  {String} eventType event type
   * @param {Object} [eventObj] event
   */
  fire(eventType, eventObj) {
    const event = new Event(eventType);
    Util.each(eventObj, function(v, k) {
      event[k] = v;
    });
    this.trigger(event);
  }
};