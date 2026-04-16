var level;
var genfn;
var cimg;
var downloadUrl;
var speedLevel = 1;
var minSpeed = 1;
var maxSpeed = 10;
var stepsPerFrame = 1;
var speedSteps = Array.from(
    {length: maxSpeed - minSpeed + 1},
    function(_, i) {
	return Math.pow(2, i);
    }
);

function init() {
    resize();
    level = 3;

    var btn = document.getElementById('imgload');
    btn.addEventListener('change', addImage);

    var download = document.getElementById('download');
    download.addEventListener('click', downloadSVG);

    var lvl = document.getElementById('level');
    if (lvl.value) level = lvl.value;
    lvl.addEventListener('change', function(e) {
	level = Math.max(0,e.target.value);
	if (genfn) {
	    genfn.next(false);
	    genfn = null;
	}
	setImageAux();
    });

    var speed = document.getElementById('speed');
    setSpeed(speed.value, speed);
    speed.addEventListener('change', function(e) {
	setSpeed(e.target.value, e.target);
    });

    var imgcvs = document.getElementById('imgcvs');
    var chk = document.getElementById('imgshow');
    chk.addEventListener('change', function(e) {
	if (e.target.checked) {
	    imgcvs.classList.remove('invisible');
	} else {
	    imgcvs.classList.add('invisible');
	}
    });
    if (chk.checked) {
	imgcvs.classList.remove('invisible');
    } else {
	imgcvs.classList.add('invisible');
    }

    var img = document.getElementById('peano');
    if (img.complete) {
	cimg = img;
	setImageAux();
    } else {
	img.addEventListener('load', setImage);
    }

     /*
      Make the question mark toggle the help pane
     */
    var hlnk = document.getElementById('helplink');
    var hdv = document.getElementById('help');
    hlnk.addEventListener('click', function(e) {
        e.preventDefault();
        if (hdv.style.display == 'none' || hdv.style.display == '') {
            hdv.style.display = 'block';
        } else {
            hdv.style.display = 'none';
        }
        return false;
    });
    /*
      Set the help pane height to the window height,
      Should probably update on resize
     */
    var h = window.innerHeight - 20;
    hdv.style.height = h + 'px';

}

function resize() {
    var pcvs = document.getElementById('peanocvs');
    var style = window.getComputedStyle(pcvs);
    var ht = style.getPropertyValue('height');
    var imgcvs = document.getElementById('imgcvs');
    pcvs.style.width = ht;
    imgcvs.style.width = ht;
}

window.addEventListener('load', init);
window.addEventListener('resize', resize);



function addImage() {
    var file = document.getElementById("imgload").files[0];

    if (file){
	var reader = new FileReader();
	reader.addEventListener('loadend', loadImage);
        reader.readAsDataURL(file);
    }
}

function loadImage(e) {
    var img = new Image();
    img.addEventListener("load", setImage);
    img.src = e.target.result;
}

function setImage(e){
    cimg = e.target;
    setImageAux();
}

function setImageAux() {
    var delt = document.getElementById('download');
    var imgcvs = document.getElementById('imgcvs');
    var ctx = imgcvs.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    if (downloadUrl) {
	URL.revokeObjectURL(downloadUrl);
	downloadUrl = null;
    }
    delt.disabled = true;
    delete delt.dataset.filename;

    var w = cimg.width;
    var h = cimg.height;
    var as = Math.min(w,h);
    var cs = Math.pow(3,level);
    var dx = Math.min(0,as - w)*cs/as/2;
    var dy = Math.min(0,as - h)*cs/as/2;
    imgcvs.width = cs;
    imgcvs.height = cs;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(cimg, dx, dy, w*cs/as, h*cs/as);
    genfn = generateCurve(ctx.getImageData(0, 0, imgcvs.width, imgcvs.height));
    window.requestAnimationFrame(doStep);
}

function setSpeed(value, input) {
    speedLevel = Math.max(minSpeed, Math.min(maxSpeed, parseInt(value,10)));
    stepsPerFrame = speedSteps[speedLevel - minSpeed];
    input.value = speedLevel;
}

function downloadSVG() {
    var delt = document.getElementById('download');
    var link;

    if (delt.disabled || !downloadUrl) {
	return;
    }

    link = document.createElement('a');
    link.href = downloadUrl;
    link.download = delt.dataset.filename || 'Peano.svg';
    link.click();
}

function doStep() {
    var steps;
    var rv;

    if (!genfn) {
	return;
    }

    for (steps = 0; steps < stepsPerFrame; steps++) {
	rv = genfn.next(true);
	if (rv.done) {
	    break;
	}
    }

    if (!rv.done) {
	window.requestAnimationFrame(doStep);
    } else {
	genfn = false;
	var delt = document.getElementById('download');
	var svg = rv.value.exportToSVG().outerHTML;
	if (downloadUrl) {
	    URL.revokeObjectURL(downloadUrl);
	}
	downloadUrl = URL.createObjectURL(new Blob([svg], {type: 'image/svg+xml'}));
	var file = document.getElementById("imgload").files[0];
	var name;
	if (file) {
	    name = file.name.replace(/\.[^\.]*$/,'');
	} else {
	    name = 'Peano';
	}
	delt.dataset.filename = name + '-' + level + '.svg';
	delt.disabled = false;
    }
}

function* generateCurve(imgd) {
    var imgcvs = document.getElementById('imgcvs');
    var pcvs = document.getElementById('peanocvs');
    var pctx = pcvs.getContext('2d');
    var style = window.getComputedStyle(pcvs);
    var w = style.getPropertyValue('height');

    w = Math.floor(parseInt(w,10) + .5);
    pcvs.width = w;
    pcvs.height = w;

    pctx.lineWidth = 2;
    pctx.strokeStyle = 'black';

    var peano = new Path();
    peano.setContext(pctx);

    var o,d,k;
    var imgp = imgd.data;
    var stride = imgcvs.width * 4;
    var idx;
    var sf = w/Math.pow(3,level);

    peano.scope();
    peano.moveTo([0,0]);
    peano.scope();
    o = peano.getCoords([.5,.5]);
    peano.rotateBy90CCW();
    peano.scaleBy(sf);

    var ct = true;

    for (var i = 0; ct && i < Math.pow(9,level); i++) {
	d = -Math.pow(-1, i%2);
	if (i%3 == 0) {
	    k = i;
	    while (k != 0 && k%3 == 0) {
		k /= 3;
		d *= -1;
	    }
	}
	peano.rotateBy90(d);

	c = peano.getCoords([.5,.5]);
	c[0] = Math.floor( c[0]/sf );
	c[1] = Math.floor( c[1]/sf );

	if (
	    c[0] < 0
		|| c[0] >= Math.pow(3^level)
		|| c[1] < 0
		|| c[1] >= Math.pow(3^level)
	   ) {
	    gr = 0;
	} else {
	    idx = c[1] * stride + c[0] * 4;
	    gr = (imgp[idx]*.3 + imgp[idx + 1]*.4 + imgp[idx + 2]*.3)/255;
	}

	doLine(peano,gr);

	peano.shiftBy([1,1]);

//	path.setAttribute("d",peano.exportToSVG());
	ct = yield peano;
    }
    peano.lineTo([0,0]);
    peano.endscope();
    peano.endpath();
    peano.endscope();
    return peano;
}

function doLine(p,t) {
    var ret = getGrey(t);
    var r = ret[0];
    var a = ret[1];
    var e = r/Math.sqrt(2)*2;
    var mc = [(1 - t)/3,(1 - t)/3];
    var md = [1 - mc[0], 1 - mc[1]];
    p.scope();
    p.lineTo([1/9, 1/9]);

    p.scaleBy(1/e);
    p.lineTo(md);
    p.shiftBy([1,1]);
    p.rotateBy(a-t*Math.PI);
    p.rotateBy(Math.PI/2-t*Math.PI/2);
    p.lineTo(mc);
    p.lineTo(md);
    p.shiftBy([1,1]);
    for (var j = -1; j < 2; j+= 2) {
	for (var i = 1; i < 4; i++) {
	    p.rotateBy(j*Math.PI/2 - j*t*Math.PI/2);
	    p.lineTo(mc);
	    p.lineTo(md);
	    p.shiftBy([1,1]);
	}
    }
    p.rotateBy(-Math.PI/2+t*Math.PI/2);
    p.lineTo(mc);
    p.endscope();
    p.lineTo([8/9, 8/9]);
}

function getGrey(g) {
    var v = [
	    .5
	    + Math.cos(Math.PI/2*(1 - g))
	    + Math.sin(Math.PI/2*(1 - g))
	    + Math.cos(2*Math.PI/2*(1 - g))
	    + Math.sin(2*Math.PI/2*(1 - g))
	    + Math.cos(3*Math.PI/2*(1 - g))
	    + Math.sin(3*Math.PI/2*(1 - g))
	,
	    .5
	    + Math.cos(Math.PI/2*(1 - g))
	    - Math.sin(Math.PI/2*(1 - g))
	    + Math.cos(2*Math.PI/2*(1 - g))
	    - Math.sin(2*Math.PI/2*(1 - g))
	    + Math.cos(3*Math.PI/2*(1 - g))
	    - Math.sin(3*Math.PI/2*(1 - g))
    ];
    var l = 1 + 1/Math.sqrt(v[0]*v[0] + v[1]*v[1])*Math.sqrt(2);
    var v = [v[0]*l, v[1]*l];
    var a = (Math.atan2(v[1], v[0]) + 3*Math.PI/4);
    var r = Math.sqrt(v[0]*v[0] + v[1]*v[1]);
    return [r,a];
}

/*
Matrix [a,b,c,d,e,f]

[a c] + [e]
[b d]   [f]

Matrix * Vector

[a,b,c,d,e,f] * [x,y]

[a*x + c*y + e]
[b*x + d*y + f]

Matrix * Matrix

[a,b,c,d,e,f] * [g,h,i,j,k,l]

([a c] + [e]) * ([g i] + [k]) = [a c] * [g i] + [a c] * [k] + [e]
([b d]   [f])   ([h j]   [l]) = [b d] * [h j] + [b d] * [l] + [f]

*/

class Path {

    bb = [0,0,0,0];
    matrix = [1,0,0,1,0,0];
    scopes = [];
    segments = [];
    point = [0,0];
    context;

    constructor() {
	return this;
    }

    setContext(c) {
	this.context = c;
    }

    resetTransform() {
	this.point = [0,0];
	this.matrix = [1,0,0,1,0,0];
    }

    clearScopes() {
	this.scopes = [];
    }

    clone(m) {
	return m.slice();
    }

    path() {
	return this.segments;
    }

    endpath() {
    }

    scope() {
	this.scopes.push(this.clone(this.matrix));
    }

    endscope() {
	if (this.scopes.length > 0) {
	    this.matrix = this.scopes.pop();
	} else {
	    this.resetTransform();
	}
    }

    compose(m,mm) {
	return [
	    m[0] * mm[0] + m[2] * mm[1],
	    m[1] * mm[0] + m[3] * mm[1],
	    m[0] * mm[2] + m[2] * mm[3],
	    m[1] * mm[2] + m[3] * mm[3],
	    m[0] * mm[4] + m[2] * mm[5] + m[4],
	    m[1] * mm[4] + m[3] * mm[5] + m[5]
	];
    }

    composeMatrix(m) {
	this.matrix = this.compose(this.matrix, m);
    }

    transform(v) {
	return [
	    this.matrix[0] * v[0] + this.matrix[2] * v[1] + this.matrix[4],
	    this.matrix[1] * v[0] + this.matrix[3] * v[1] + this.matrix[5]
	];
    }

    transformNS(v) {
	return [
	    this.matrix[0] * v[0] + this.matrix[2] * v[1],
	    this.matrix[1] * v[0] + this.matrix[3] * v[1]
	];
    }

    getCoords(v) {
	return this.transform(v);
    }

    updateBB(v) {
	this.bb = [
	    Math.min(this.bb[0], v[0]),
	    Math.min(this.bb[1], v[1]),
	    Math.max(this.bb[2], v[0]),
	    Math.max(this.bb[3], v[1])
	];
    }

    moveTo(v) {
	this.point = this.transform(v);
	this.updateBB(this.point);
	this.segments.push(["m", this.point.slice()]);
    }

    lineTo(v) {
	this.context.beginPath();
	this.context.moveTo(this.point[0],this.point[1]);

	this.point = this.transform(v);

	this.context.lineTo(this.point[0],this.point[1]);
	this.context.stroke();

	this.updateBB(this.point);
	this.segments.push(["l", this.point.slice()]);
    }

    moveToR(v) {
	var pt = this.transform(v);
	this.point = [this.point[0] + pt[0], this.point[1] + pt[1]];
	this.updateBB(this.point);
	this.segments.push(["m", this.point.slice()]);
    }

    lineToR(v) {
	var pt = this.transform(v);
	this.point = [this.point[0] + pt[0], this.point[1] + pt[1]];
	this.updateBB(this.point);
	this.segments.push(["m", this.point.slice()]);
    }

    shiftBy(v) {
	var m = [1,0,0,1,v[0], v[1]];
	this.composeMatrix(m);
    }

    scaleBy(v) {
	var m;
	if (typeof v == "Array") {
	    m = [v[0], 0, 0, v[1], 0, 0];
	} else {
	    m = [v, 0, 0, v, 0, 0];
	}
	this.composeMatrix(m);
    }

    rotateBy(a) {
	var c = Math.cos(a);
	var s = Math.sin(a);

	var m = [c, s, -s, c, 0, 0];
	this.composeMatrix(m);
    }

    rotateBy90CCW() {
	var m = [0,1,-1,0,0,0];
	this.composeMatrix(m);
    }

    rotateBy90CW() {
	var m = [0,-1,1,0,0,0];
	this.composeMatrix(m);
    }

    rotateBy90(a) {
	var m = [0,a,-a,0,0,0];
	this.composeMatrix(m);
    }

    exportToSVG() {
	var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
	svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns", "http://www.w3.org/2000/svg");

	var s = this.bb.map(x => Math.ceil(x));

	svg.setAttribute('width', s[2] - s[0]);
	svg.setAttribute('height', s[3] - s[1]);
	svg.setAttribute('viewbox', s.join(" "));

	var spath = document.createElementNS("http://www.w3.org/2000/svg", "path");
	spath.setAttribute('stroke', 'black');
	spath.setAttribute('fill', 'none');
	spath.setAttribute('stroke-width', '2px');

	var path = [];

	for (var i = 0; i < this.segments.length; i++) {
	    if (this.segments[i][0] == "m") {
		path.push("M");
	    } else {
		path.push("L");
	    }
	    path.push(Math.floor( this.segments[i][1][0] * 100)/100);
	    path.push(Math.floor( this.segments[i][1][1] * 100)/100);
	}
	spath.setAttribute('d', path.join(" "));
	svg.appendChild(spath);
	return svg;
    }

}
