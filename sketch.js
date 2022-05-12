let canvas;
var pg, comp;

let helvetica;
let pressstart;
let blurShader;

var shouldReset = true;

function preload() {
    helvetica = loadFont('assets/HelveticaNeueBd.ttf');
    pressstart = loadFont('assets/PressStart2P-Regular.ttf');
    blurShader = loadShader('assets/blur.vert', 'assets/blur.frag');
}

function setup(){
    canvas = createCanvas(windowWidth, windowHeight, WEBGL);
    pg = createGraphics(width, height, WEBGL);
    comp = createGraphics(width, height, WEBGL);
    click = createGraphics(width, height);
    imageMode(CENTER);
}

function draw(){
    if(shouldReset)
        reset();

    shaderOnCanvas(pg);
}

var shapes = [];

function generateShapes(){
    shapes = [];
    for(var k = 0; k < 25; k++){
        var shape = [];
        var rx = random(-222, 222);
        var ry = random(-222, 222);
        var r = random(33, 66)*2;
        var oa = random(1000);
        var parts = round(random(3, 100));
        var chc = random(3);
        if(chc < 1){
            parts = 3;
        }
        else if(chc < 2){
            parts = 4;
        }
        else if(chc < 3){
            parts = 100;
        }
        for(var a = 0; a < 360; a += 360/parts){
            var x = rx + r*cos(radians(a+oa));
            var y = ry + r*sin(radians(a+oa));
            shape.push([x, y]);
        }
        shapes.push(shape);
    }
}

function resample(shape){
    var detail = 10;
    var newshape = [];
    print("aa")
    for(var k = 0; k < shape.length; k++){
        var ind1 = k;
        var ind2 = (k+1)%shape.length;
        var p1 = createVector(shape[ind1][0], shape[ind1][1]);
        var p2 = createVector(shape[ind2][0], shape[ind2][1]);

        var d = p5.Vector.dist(p1, p2);

        newshape.push([p1.x, p1.y]);

        var dir = p5.Vector.sub(p2, p1);
        dir.normalize();
        if(d > detail){
            var nn = round(d/detail);
            var ndt = d/nn;
            var cp = p1.copy();
            dir.mult(ndt);
            cp.add(dir);  
            while(p5.Vector.dist(cp, p2) > ndt*1.2){ // .2 is actually 1.0, but this is safer
                cp.add(dir); 
                newshape.push([cp.x, cp.y]);
            }
        }
        
    }
    return newshape;
}

function distort(shape){
    var distorted = [];
    var frq = 0.002;
    for(var k = 0; k < shape.length; k++){
        var ind1 = k;
        var ind2 = (k+1)%shape.length;
        var p1 = createVector(shape[ind1][0], shape[ind1][1]);
        var p2 = createVector(shape[ind2][0], shape[ind2][1]);

        p1.x += -55 * (-.5 + power(noise(p1.x*frq, p1.y*frq, 931.3141), 2));
        p1.y += -55 * (-.5 + power(noise(p1.x*frq, p1.y*frq, 222.1665), 2));

        distorted.push([p1.x, p1.y]);
    }
    return distorted;
}

function drawShapes(){

    var colors = [
        color("#9d2b22"),
        color("#594670"),
        color("#f36864"),
        color("#3d2953"),
        color("#05413c")
    ]

    for(var s = 0 ; s < shapes.length; s++){
        var shape = shapes[s];
        
        pg.push();
        pg.translate(0, 0, s);
        var resampled = resample(shape);
        var distorted = distort(resampled);

        // SHADOW
        pg.fill(90);
        pg.noStroke();
        pg.beginShape();
        for(var pt = 0; pt < distorted.length; pt++){
            var x = distorted[pt][0];
            var y = distorted[pt][1];
            //pg.vertex(x, y, -.01);
        }
        pg.endShape();

        // FILL
        pg.fill(colors[s%colors.length]);
        pg.noStroke();
        pg.stroke(90);
        pg.beginShape();
        for(var pt = 0; pt < distorted.length; pt++){
            var x = distorted[pt][0];
            var y = distorted[pt][1];
            pg.vertex(x, y, -.01);
        }
        pg.endShape(CLOSE);
        
        // STROKE
        pg.stroke(90);
        pg.strokeWeight(1.4);
        pg.noFill();
        pg.beginShape();
        for(var pt = 0; pt < shape.length; pt++){
            var x = shape[pt][0];
            var y = shape[pt][1];
            //pg.vertex(x, y);
        }
        pg.endShape(CLOSE);

        // CUTS
        //cutShape(distorted);
        pg.pop();
    }
    pg.strokeWeight(1);
    pg.fill(90);
    pg.noStroke();
    for(var s = 0 ; s < shapes.length; s++){
        var shape = shapes[s];
        for(var pt = 0; pt < shape.length; pt++){
            var x = shape[pt][0];
            var y = shape[pt][1];
            //pg.ellipse(x, y, 5, 5);
        }
    }
}

function intersect(a1, a2, b1, b2){
    var p = a1;
    var r = p5.Vector.sub(a2, a1);
    var q = b1;
    var s = p5.Vector.sub(b2, b1);
    var t = p5.Vector.sub(q, p).dot(s)/p5.Vector.dot(r, s);
    if(t > 0 && t < 1 && abs(p5.Vector.dot(r, s)) > 0.01){
        return p5.Vector.add(p, p5.Vector.mult(r, t));
    }
    else
        return;
}

var cutlines = [];

function cutShape(shape){
    cutlines = []
    var dir = createVector(1, 0);
    dir.rotate(random(1000.));
    pg.strokeWeight(1.4);
    for(var q = 0; q < 2; q++){
        var cp = createVector(0, 0);
        var ncuts = 100;
        var cutl = 10;
        dir.rotate(PI/2);
        cp.add(p5.Vector.mult(dir, -50*cutl));
        for(var k = 0; k < ncuts; k++){
            //pg.fill(90);
            //pg.noStroke();
            cp.add(p5.Vector.mult(dir, cutl));
            //pg.ellipse(cp.x, cp.y, 1, 1);
            for(var pt = 0; pt < shape.length; pt++){
                var p1 = createVector(shape[pt][0], shape[pt][1]);
                var p2 = createVector(shape[(pt+1)%shape.length][0], shape[(pt+1)%shape.length][1]);
                var ins = intersect(p1, p2, cp, p5.Vector.add(cp, dir));
                if(ins){
                    //pg.ellipse(ins.x, ins.y, 5, 5);
                    if(cutlines.length == 0){
                        cutlines.push([[ins.x, ins.y]]);
                    }
                    else{
                        if(cutlines[cutlines.length-1].length == 2){
                            cutlines.push([[ins.x, ins.y]]);
                        }
                        else{
                            cutlines[cutlines.length-1].push([ins.x, ins.y]);
                        }
                    }
                }
            }
        }
        for(var k = 0; k < cutlines.length; k++){
            pg.line(cutlines[k][0][0]+q*1, cutlines[k][0][1], cutlines[k][1][0]+q*1, cutlines[k][1][1]);
        }
    }
}

function reset(){

    pg.push();

    pg.clear();

    pg.colorMode(HSB, 100);
    pg.rectMode(CENTER);
    pg.background(90);
    
    generateShapes();
    drawShapes();

    //pg.fill(90);
    //pg.noStroke();
    //pg.ellipse(width/2, height/2, 250, 250);
    for(var k = 0; k < -7; k++){
        var w = random(200, 300);
        var h = random(200, 300);
        var d = random(5, 8)*0 + 8;
        var nw = round(w/d);
        var dw = w/nw;
        var nh = round(h/d);
        var dh = h/nh;
        var ra = radians(random(-20, 20));
        var rx = random(-100, 100);
        var ry = random(-100, 100);

        pg.push();
        pg.translate(rx, ry);
        pg.rotate(ra);
        pg.noStroke();
        pg.fill(10);
        pg.rect(0, 0, w, h);

        pg.noFill();
        pg.stroke(90);
        for(var y = -h/2; y <= +h/2+0.01; y += dh){
            pg.line(-w/2, y, +w/2, y);
        }
        
        for(var x = -w/2; x <= +w/2+0.01; x += dw){
            pg.line(x, -h/2, x, +h/2);
        }
        pg.pop();
    }
    pg.pop();

    shouldReset = false;
}


function shaderOnCanvas(tex){
    randomSeed(random(millis()));
    noiseSeed(random(millis()*12.314));

    blurShader.setUniform('seed2d', [random(-20, 20), random(-20, 20)]);
    blurShader.setUniform('tex0', tex);
    blurShader.setUniform('texelSize', [1 / width, 1 / height]);
    blurShader.setUniform('grunge', random(1.6));
    blurShader.setUniform('grunge2', random(0.3, 0.6));
    blurShader.setUniform('frq1', random(0.003, 0.008));
    blurShader.setUniform('frq2', random(0, 1));
    blurShader.setUniform('frq3', random(0, 1));
    blurShader.setUniform('frq4', random(0, 1));
    blurShader.setUniform('frq5', random(0, 1)*0+.5);
    blurShader.setUniform('frq6', random(0, 1));

    comp.shader(blurShader);
    comp.fill(255);
    comp.rect(-width/2, -height/2, width, height);

    shader(blurShader);
    fill(255);
    image(comp, 0, 0);
}



var shapes = [];
var vels = [];
var isdrawing = false;

function mouseClicked(){
    shouldReset = true;
}


function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    pg = createGraphics(width, height);
    reset();
}

function power(p, g) {
    if (p < 0.5)
        return 0.5 * pow(2*p, g);
    else
        return 1 - 0.5 * pow(2*(1 - p), g);
}