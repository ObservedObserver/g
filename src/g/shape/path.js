/**
 * @fileOverview Path
 * @author dxq613@gmail.com
 * @author hankaiai@126.com
 * @see http://www.w3.org/TR/2011/REC-SVG11-20110816/paths.html#PathData
 * @ignore
 */
const Util = require('../../util/index');
const Shape = require('../core/shape');
const PathSegment = require('./util/pathSegment');
const Format = require('../format');
const Arrow = require('./util/arrow');
const pathUtil = require('@ali/g-path-util');
const CubicMath = require('./math/cubic');
const Matrix = require('@ali/g-matrix');
const Vector2 = Matrix.Vector2;

const Path = function(cfg) {
  Path.superclass.constructor.call(this, cfg);
};

Path.ATTRS = {
  path: null,
  lineWidth: 1,
  curve: null, // 曲线path
  tCache: null
};

Util.extend(Path, Shape);

Util.augment(Path, {
  canFill: true,
  canStroke: true,
  type: 'path',
  getDefaultAttrs() {
    return {
      lineWidth: 1
    };
  },
  __afterSetAttrPath(path) {
    const self = this;
    if (Util.isNil(path)) {
      self.setSilent('segments', null);
      self.setSilent('box', undefined);
      return;
    }
    const pathArray = Format.parsePath(path);
    let preSegment;
    const segments = [];

    if (!Util.isArray(pathArray) ||
      pathArray.length === 0 ||
      (pathArray[0][0] !== 'M' &&
        pathArray[0][0] !== 'm')
    ) {
      return;
    }
    const count = pathArray.length;
    for (let i = 0; i < pathArray.length; i++) {
      const item = pathArray[i];
      preSegment = new PathSegment(item, preSegment, i === count - 1);
      segments.push(preSegment);
    }
    self.setSilent('segments', segments);
    self.set('tCache', null);
    this.setSilent('box', null);
  },
  __afterSetAttrAll(objs) {
    if (objs.path) {
      this.__afterSetAttrPath(objs.path);
    }
  },
  calculateBox() {
    const self = this;
    const attrs = self.__attrs;
    let lineWidth = attrs.lineWidth;
    const lineAppendWidth = attrs.lineAppendWidth || 0;
    const segments = self.get('segments');

    if (!segments) {
      return null;
    }
    lineWidth += lineAppendWidth;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    Util.each(segments, function(segment) {
      segment.getBBox(lineWidth);
      const box = segment.box;
      if (box) {
        if (box.minX < minX) {
          minX = box.minX;
        }

        if (box.maxX > maxX) {
          maxX = box.maxX;
        }

        if (box.minY < minY) {
          minY = box.minY;
        }

        if (box.maxY > maxY) {
          maxY = box.maxY;
        }
      }
    });
    return {
      minX,
      minY,
      maxX,
      maxY
    };
  },
  isPointInPath(x, y) {
    const self = this;
    const fill = self.hasFill();
    const stroke = self.hasStroke();

    if (fill && stroke) {
      return self.__isPointInFill(x, y) || self.__isPointInStroke(x, y);
    }

    if (fill) {
      return self.__isPointInFill(x, y);
    }

    if (stroke) {
      return self.__isPointInStroke(x, y);
    }

    return false;
  },
  __isPointInFill(x, y) {
    const self = this;
    const context = self.get('context');
    if (!context) return undefined;
    self.createPath();
    return context.isPointInPath(x, y);
  },
  __isPointInStroke(x, y) {
    const self = this;
    const segments = self.get('segments');
    const attrs = self.__attrs;
    let lineWidth = attrs.lineWidth;
    const appendWidth = attrs.lineAppendWidth || 0;
    lineWidth += appendWidth;
    for (let i = 0, l = segments.length; i < l; i++) {
      if (segments[i].isInside(x, y, lineWidth)) {
        return true;
      }
    }

    return false;
  },
  __setTcache() {
    let totalLength = 0;
    let tempLength = 0;
    const tCache = [];
    let segmentT;
    let segmentL;
    let segmentN;
    let l;
    const curve = this.curve;

    if (!curve) {
      return;
    }

    Util.each(curve, function(segment, i) {
      segmentN = curve[i + 1];
      l = segment.length;
      if (segmentN) {
        totalLength += CubicMath.len(segment[l - 2], segment[l - 1], segmentN[1], segmentN[2], segmentN[3], segmentN[4], segmentN[5], segmentN[6]);
      }
    });

    Util.each(curve, function(segment, i) {
      segmentN = curve[i + 1];
      l = segment.length;
      if (segmentN) {
        segmentT = [];
        segmentT[0] = tempLength / totalLength;
        segmentL = CubicMath.len(segment[l - 2], segment[l - 1], segmentN[1], segmentN[2], segmentN[3], segmentN[4], segmentN[5], segmentN[6]);
        tempLength += segmentL;
        segmentT[1] = tempLength / totalLength;
        tCache.push(segmentT);
      }
    });

    this.tCache = tCache;
  },
  __calculateCurve() {
    const self = this;
    const attrs = self.__attrs;
    const path = attrs.path;
    this.curve = pathUtil.toCurve(path);
  },
  getPoint(t) {
    let tCache = this.tCache;
    let subt;
    let index;

    if (!tCache) {
      this.__calculateCurve();
      this.__setTcache();
      tCache = this.tCache;
    }

    const curve = this.curve;

    if (!tCache) {
      if (curve) {
        return {
          x: curve[0][1],
          y: curve[0][2]
        };
      }
      return null;
    }
    Util.each(tCache, function(v, i) {
      if (t >= v[0] && t <= v[1]) {
        subt = (t - v[0]) / (v[1] - v[0]);
        index = i;
      }
    });
    const seg = curve[index];
    if (Util.isNil(seg) || Util.isNil(index)) {
      return null;
    }
    const l = seg.length;
    const nextSeg = curve[index + 1];
    return {
      x: CubicMath.at(seg[l - 2], nextSeg[1], nextSeg[3], nextSeg[5], 1 - subt),
      y: CubicMath.at(seg[l - 1], nextSeg[2], nextSeg[4], nextSeg[6], 1 - subt)
    };
  },
  createPath(context) {
    const self = this;
    const attrs = self.__attrs;
    const segments = self.get('segments');
    const lineWidth = attrs.lineWidth;
    const arrow = attrs.arrow;

    if (!Util.isArray(segments)) return;
    context = context || self.get('context');
    context.beginPath();
    for (let i = 0, l = segments.length; i < l; i++) {
      if (i === l - 1 && arrow) {
        const lastSeg = segments[i];
        const endTangent = segments[i].endTangent;
        const endPoint = {
          x: lastSeg.params[lastSeg.params.length - 1].x,
          y: lastSeg.params[lastSeg.params.length - 1].y
        };
        if (lastSeg && Util.isFunction(endTangent)) {
          const v = endTangent();
          const end = Arrow.getEndPoint(v, new Vector2(endPoint.x, endPoint.y), lineWidth);
          lastSeg.params[lastSeg.params.length - 1] = end;
          segments[i].draw(context);
          Arrow.makeArrow(context, v, end, lineWidth);
          lastSeg.params[lastSeg.params.length - 1] = endPoint;
        }
      } else {
        segments[i].draw(context);
      }
    }
  }
});

module.exports = Path;
