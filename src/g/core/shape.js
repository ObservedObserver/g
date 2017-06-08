const Util = require('../../util/index');
const Element = require('./element');
const Inside = require('../shape/util/inside');
const Vector3 = require('@ali/g-matrix').Vector3;

const Shape = function(cfg) {
  Shape.superclass.constructor.call(this, cfg);
};

Shape.ATTRS = {};

Util.extend(Shape, Element);

Util.augment(Shape, {
  isShape: true,
  createPath() {},
  drawInner(context) {
    const self = this;
    const attrs = self.__attrs;
    self.createPath(context);
    const originOpacity = context.globalAlpha;
    if (self.hasFill()) {
      const fillOpacity = attrs.fillOpacity;
      if (!Util.isNil(fillOpacity) && fillOpacity !== 1) {
        context.globalAlpha = fillOpacity;
        context.fill();
        context.globalAlpha = originOpacity;
      } else {
        context.fill();
      }
    }
    if (self.hasStroke()) {
      const lineWidth = self.__attrs.lineWidth;
      if (lineWidth > 0) {
        const strokeOpacity = attrs.strokeOpacity;
        if (!Util.isNil(strokeOpacity) && strokeOpacity !== 1) {
          context.globalAlpha = strokeOpacity;
        }
        context.stroke();
      }
    }
  },
  /**
   * 节点是否在图形中
   * @param  {Number}  x x 坐标
   * @param  {Number}  y y 坐标
   * @return {Boolean}  是否在图形中
   */
  isPointInPath() {
    return false;
  },
  /**
   * 击中图形时是否进行包围盒判断
   * @return {Boolean} [description]
   */
  isHitBox() {
    return true;
  },
  /**
   * 节点是否能够被击中
   * @param {Number} x x坐标
   * @param {Number} y y坐标
   * @return {Boolean} 是否在图形中
   */
  isHit(x, y) {
    const self = this;
    const v = new Vector3(x, y, 1);
    self.invert(v); // canvas

    if (self.isHitBox()) {
      const box = self.getBBox();
      if (box && !Inside.box(box.minX, box.maxX, box.minY, box.maxY, v.x, v.y)) {
        return false;
      }
    }
    const clip = self.__attrs.clip;
    if (clip) {
      if (clip.inside(x, y)) {
        return self.isPointInPath(v.x, v.y);
      }
    } else {
      return self.isPointInPath(v.x, v.y);
    }
    return false;
  },
  /**
   * @protected
   * 计算包围盒
   * @return {Object} 包围盒
   */
  calculateBox() {
    return null;
  },
  // 清除当前的矩阵
  clearTotalMatrix() {
    this.__cfg.totalMatrix = null;
    this.__cfg.region = null;
  },
  clearBBox() {
    this.__cfg.box = null;
    this.__cfg.region = null;
  },
  getBBox() {
    let box = this.__cfg.box;
    // 延迟计算
    if (!box) {
      box = this.calculateBox();
      if (box) {
        box.x = box.minX;
        box.y = box.minY;
        box.width = box.maxX - box.minX;
        box.height = box.maxY - box.minY;
      }
      this.__cfg.box = box;
    }
    return box;
  }
});

module.exports = Shape;
