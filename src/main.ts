export = function (param: g.GameMainParameterObject): void {
    const scene = new g.Scene({game: g.game});
    scene.loaded.add(onSceneLoaded.bind(null, scene));
    g.game.pushScene(scene);
}

function onSceneLoaded(scene: g.Scene) {
    const pt1: g.CommonOffset = {x: 300, y: 100};
    const pt2: g.CommonOffset = {x: 200, y: 300};
    const pt3: g.CommonOffset = {x: 500, y: 200};

    // 背景
    scene.append(new g.FilledRect({
        scene,
        cssColor: "#EEEEEE",
        width: g.game.width,
        height: g.game.height
    }));

    // 頂点
    const v1 = new Point(scene, pt1);
    const v2 = new Point(scene, pt2);
    const v3 = new Point(scene, pt3);

    // 三角形
    new Triangle(scene, v1, v2, v3);

    // 辺
    new Line(scene, v1, v2);
    new Line(scene, v2, v3);
    new Line(scene, v3, v1);
}

class Point {
    public readonly changed: g.Trigger<g.CommonOffset>;
    private rect: g.FilledRect;

    constructor(scene: g.Scene, public readonly pt: g.CommonOffset) {
        const pointSize = 10;
        this.changed = new g.Trigger();
        this.rect = new g.FilledRect({
            scene,
            cssColor: "#0000FF",
            width: pointSize,
            height: pointSize,
            x: pt.x - pointSize / 2,
            y: pt.y - pointSize / 2,
            touchable: true
        });
        scene.append(this.rect);
        this.rect.pointMove.add(e => {
            this.rect.moveBy(e.prevDelta.x, e.prevDelta.y);
            pt.x += e.prevDelta.x;
            pt.y += e.prevDelta.y;
            this.rect.modified();
            this.changed.fire(pt);
        });
    }
}

class Line {
    private rect: g.FilledRect;

    constructor(scene: g.Scene, v1: Point, v2: Point) {
        this.rect = new g.FilledRect({
            scene,
            cssColor: "#000000",
            width: 0,
            height: 0
        });
        this.update(v1.pt, v2.pt);
        scene.append(this.rect);
        v1.changed.add(pt1 => this.update(pt1, v2.pt));
        v2.changed.add(pt2 => this.update(v1.pt, pt2));
    }

    private update(pt1: g.CommonOffset, pt2: g.CommonOffset): void {
        const lineWidth = 2;
        const lineLength = Math.sqrt(Math.pow(pt2.x - pt1.x, 2) + Math.pow(pt2.y - pt1.y, 2));
        const lineAngle = Math.atan2(pt2.y - pt1.y, pt2.x - pt1.x) * (180 / Math.PI);
        this.rect.width = lineLength;
        this.rect.height = lineWidth;
        this.rect.angle = lineAngle;
        this.rect.x = (pt2.x + pt1.x - lineLength) / 2;
        this.rect.y = (pt2.y + pt1.y - lineWidth) / 2;
        this.rect.modified();
    }
}

class Triangle {
    private baseRect: g.FilledRect;
    private removeArea1: g.FilledRect;
    private removeArea2: g.FilledRect;
    private removeArea3: g.FilledRect;

    constructor(scene: g.Scene, v1: Point, v2: Point, v3: Point) {
        // 描画するペイン
        const pane = new g.Pane({
            scene,
            width: g.game.width,
            height: g.game.height
        });
        scene.append(pane);
        // 大きい矩形
        this.baseRect = new g.FilledRect({
            scene,
            cssColor: "#FF0000",
            width: 0,
            height: 0,
        });
        pane.append(this.baseRect);
        // 削除する部分
        this.removeArea1 = new g.FilledRect({
            scene,
            cssColor: "#000000",
            width: 0,
            height: 0,
            compositeOperation: g.CompositeOperation.DestinationOut
        });
        pane.append(this.removeArea1);
        this.removeArea2 = new g.FilledRect({
            scene,
            cssColor: "#000000",
            width: 0,
            height: 0,
            compositeOperation: g.CompositeOperation.DestinationOut
        });
        pane.append(this.removeArea2);
        this.removeArea3 = new g.FilledRect({
            scene,
            cssColor: "#000000",
            width: 0,
            height: 0,
            compositeOperation: g.CompositeOperation.DestinationOut
        });
        pane.append(this.removeArea3);
        this.update(v1.pt, v2.pt, v3.pt);
        v1.changed.add(() =>  this.update(v1.pt, v2.pt, v3.pt));
        v2.changed.add(() =>  this.update(v1.pt, v2.pt, v3.pt));
        v3.changed.add(() =>  this.update(v1.pt, v2.pt, v3.pt));
    }

    private update(pt1: g.CommonOffset, pt2: g.CommonOffset, pt3: g.CommonOffset, ) {
        const [ptA, ptB, ptC] = toCounterClockwise(pt1, pt2, pt3);
        this.updateBaseRect(ptA, ptB, ptC);
        this.updateRemoveArea(ptA, ptB, this.removeArea1);
        this.updateRemoveArea(ptB, ptC, this.removeArea2);
        this.updateRemoveArea(ptC, ptA, this.removeArea3);
    }

    private updateBaseRect(pt1: g.CommonOffset, pt2: g.CommonOffset, pt3: g.CommonOffset): void {
        this.baseRect.x = Math.min(pt1.x, pt2.x, pt3.x);
        this.baseRect.y = Math.min(pt1.y, pt2.y, pt3.y);
        this.baseRect.width = Math.max(pt1.x, pt2.x, pt3.x) - this.baseRect.x;
        this.baseRect.height = Math.max(pt1.y, pt2.y, pt3.y) - this.baseRect.y;
        this.baseRect.modified();
    }

    private updateRemoveArea(pt1: g.CommonOffset, pt2: g.CommonOffset, rect: g.FilledRect): void {
        const angleRad = Math.atan2(pt2.y - pt1.y, pt2.x - pt1.x);
        const size = Math.sqrt(Math.pow(pt1.x - pt2.x, 2) + Math.pow(pt1.y - pt2.y, 2));
        const dx = pt1.x + Math.cos(angleRad - Math.PI / 2) * size;
        const dy = pt1.y + Math.sin(angleRad - Math.PI / 2) * size;
        rect.x = (pt2.x + dx) / 2 - size;
        rect.y = (pt2.y + dy - size) / 2;
        rect.width = size * 2;
        rect.height = size;
        rect.angle = angleRad / Math.PI * 180;
        rect.modified();
    }
}

/**
 * 点を反時計回りに並べる
 */
function toCounterClockwise(
    pt1: g.CommonOffset, pt2: g.CommonOffset, pt3: g.CommonOffset
): [g.CommonOffset, g.CommonOffset, g.CommonOffset] {
    if (pt2.x === pt1.x) {
        if ((pt1.y > pt2.y && pt1.x > pt3.x) || (pt1.y <= pt2.y && pt1.x <= pt3.x)) {
            return [pt2, pt1, pt3];
        } else {
            return [pt1, pt2, pt3];
        }
    } else {
        const y = pt1.y + (pt2.y - pt1.y) / (pt2.x - pt1.x) * (pt3.x - pt1.x);
        if ((y > pt3.y && pt2.x > pt1.x) || (y <= pt3.y && pt2.x <= pt1.x)) {
            return [pt2, pt1, pt3];
        } else {
            return [pt1, pt2, pt3];
        }
    }
}
