window.gLocalAssetContainer["main"] = function(g) { (function(exports, require, module, __filename, __dirname) {
"use strict";
function onSceneLoaded(scene) {
    var pt1 = { x: 300, y: 100 };
    var pt2 = { x: 200, y: 300 };
    var pt3 = { x: 500, y: 200 };
    // 背景
    scene.append(new g.FilledRect({
        scene: scene,
        cssColor: "#EEEEEE",
        width: g.game.width,
        height: g.game.height
    }));
    // 頂点
    var v1 = new Point(scene, pt1);
    var v2 = new Point(scene, pt2);
    var v3 = new Point(scene, pt3);
    // 三角形
    new Triangle(scene, v1, v2, v3);
    // 辺
    new Line(scene, v1, v2);
    new Line(scene, v2, v3);
    new Line(scene, v3, v1);
}
var Point = /** @class */ (function () {
    function Point(scene, pt) {
        var _this = this;
        this.pt = pt;
        var pointSize = 10;
        this.changed = new g.Trigger();
        this.rect = new g.FilledRect({
            scene: scene,
            cssColor: "#0000FF",
            width: pointSize,
            height: pointSize,
            x: pt.x - pointSize / 2,
            y: pt.y - pointSize / 2,
            touchable: true
        });
        scene.append(this.rect);
        this.rect.pointMove.add(function (e) {
            _this.rect.moveBy(e.prevDelta.x, e.prevDelta.y);
            pt.x += e.prevDelta.x;
            pt.y += e.prevDelta.y;
            _this.rect.modified();
            _this.changed.fire(pt);
        });
    }
    return Point;
}());
var Line = /** @class */ (function () {
    function Line(scene, v1, v2) {
        var _this = this;
        this.rect = new g.FilledRect({
            scene: scene,
            cssColor: "#000000",
            width: 0,
            height: 0
        });
        this.update(v1.pt, v2.pt);
        scene.append(this.rect);
        v1.changed.add(function (pt1) { return _this.update(pt1, v2.pt); });
        v2.changed.add(function (pt2) { return _this.update(v1.pt, pt2); });
    }
    Line.prototype.update = function (pt1, pt2) {
        var lineWidth = 2;
        var lineLength = Math.sqrt(Math.pow(pt2.x - pt1.x, 2) + Math.pow(pt2.y - pt1.y, 2));
        var lineAngle = Math.atan2(pt2.y - pt1.y, pt2.x - pt1.x) * (180 / Math.PI);
        this.rect.width = lineLength;
        this.rect.height = lineWidth;
        this.rect.angle = lineAngle;
        this.rect.x = (pt2.x + pt1.x - lineLength) / 2;
        this.rect.y = (pt2.y + pt1.y - lineWidth) / 2;
        this.rect.modified();
    };
    return Line;
}());
var Triangle = /** @class */ (function () {
    function Triangle(scene, v1, v2, v3) {
        var _this = this;
        // 描画するペイン
        var pane = new g.Pane({
            scene: scene,
            width: g.game.width,
            height: g.game.height
        });
        scene.append(pane);
        // 大きい矩形
        this.baseRect = new g.FilledRect({
            scene: scene,
            cssColor: "#FF0000",
            width: 0,
            height: 0,
        });
        pane.append(this.baseRect);
        // 削除する部分
        this.removeArea1 = new g.FilledRect({
            scene: scene,
            cssColor: "#000000",
            width: 0,
            height: 0,
            compositeOperation: g.CompositeOperation.DestinationOut
        });
        pane.append(this.removeArea1);
        this.removeArea2 = new g.FilledRect({
            scene: scene,
            cssColor: "#000000",
            width: 0,
            height: 0,
            compositeOperation: g.CompositeOperation.DestinationOut
        });
        pane.append(this.removeArea2);
        this.removeArea3 = new g.FilledRect({
            scene: scene,
            cssColor: "#000000",
            width: 0,
            height: 0,
            compositeOperation: g.CompositeOperation.DestinationOut
        });
        pane.append(this.removeArea3);
        this.update(v1.pt, v2.pt, v3.pt);
        v1.changed.add(function () { return _this.update(v1.pt, v2.pt, v3.pt); });
        v2.changed.add(function () { return _this.update(v1.pt, v2.pt, v3.pt); });
        v3.changed.add(function () { return _this.update(v1.pt, v2.pt, v3.pt); });
    }
    Triangle.prototype.update = function (pt1, pt2, pt3) {
        var _a = toCounterClockwise(pt1, pt2, pt3), ptA = _a[0], ptB = _a[1], ptC = _a[2];
        this.updateBaseRect(ptA, ptB, ptC);
        this.updateRemoveArea(ptA, ptB, this.removeArea1);
        this.updateRemoveArea(ptB, ptC, this.removeArea2);
        this.updateRemoveArea(ptC, ptA, this.removeArea3);
    };
    Triangle.prototype.updateBaseRect = function (pt1, pt2, pt3) {
        this.baseRect.x = Math.min(pt1.x, pt2.x, pt3.x);
        this.baseRect.y = Math.min(pt1.y, pt2.y, pt3.y);
        this.baseRect.width = Math.max(pt1.x, pt2.x, pt3.x) - this.baseRect.x;
        this.baseRect.height = Math.max(pt1.y, pt2.y, pt3.y) - this.baseRect.y;
        this.baseRect.modified();
    };
    Triangle.prototype.updateRemoveArea = function (pt1, pt2, rect) {
        var angleRad = Math.atan2(pt2.y - pt1.y, pt2.x - pt1.x);
        var size = Math.sqrt(Math.pow(pt1.x - pt2.x, 2) + Math.pow(pt1.y - pt2.y, 2));
        var dx = pt1.x + Math.cos(angleRad - Math.PI / 2) * size;
        var dy = pt1.y + Math.sin(angleRad - Math.PI / 2) * size;
        rect.x = (pt2.x + dx) / 2 - size;
        rect.y = (pt2.y + dy - size) / 2;
        rect.width = size * 2;
        rect.height = size;
        rect.angle = angleRad / Math.PI * 180;
        rect.modified();
    };
    return Triangle;
}());
/**
 * 点を反時計回りに並べる
 */
function toCounterClockwise(pt1, pt2, pt3) {
    if (pt2.x === pt1.x) {
        if ((pt1.y > pt2.y && pt1.x > pt3.x) || (pt1.y <= pt2.y && pt1.x <= pt3.x)) {
            return [pt2, pt1, pt3];
        }
        else {
            return [pt1, pt2, pt3];
        }
    }
    else {
        var y = pt1.y + (pt2.y - pt1.y) / (pt2.x - pt1.x) * (pt3.x - pt1.x);
        if ((y > pt3.y && pt2.x > pt1.x) || (y <= pt3.y && pt2.x <= pt1.x)) {
            return [pt2, pt1, pt3];
        }
        else {
            return [pt1, pt2, pt3];
        }
    }
}
module.exports = function (param) {
    var scene = new g.Scene({ game: g.game });
    scene.loaded.add(onSceneLoaded.bind(null, scene));
    g.game.pushScene(scene);
};

})(g.module.exports, g.module.require, g.module, g.filename, g.dirname);
}