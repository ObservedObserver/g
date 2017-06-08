const expect = require('chai').expect;
const Canvas = require('../../../src/canvas');
const div = document.createElement('div');
div.id = 'canvas-marker';
document.body.appendChild(div);


describe('Marker', function() {
  const canvas = new Canvas({
    containerId: 'canvas-marker',
    width: 200,
    height: 200,
    pixelRatio: 1
  });
  it('init', function() {
    const marker = canvas.addShape('marker', {
      attrs: {
        x: 10,
        y: 10,
        radius: 10,
        fill: 'red',
        symbol: 'circle'
      }
    });
    expect(marker.attr('x')).to.equal(10);
    expect(marker.attr('y')).to.equal(10);
  });

  it('hit', function() {
    const marker = canvas.addShape('marker', {
      attrs: {
        x: 20,
        y: 20,
        radius: 10,
        fill: 'blue',
        symbol: 'circle'
      }
    });
    expect(marker.isHit(20, 20)).to.be.true;
    expect(marker.isHit(10, 10)).to.be.false;
  });
});
