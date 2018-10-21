/**
 * 
 */
var obFrom, obTo, obCols, gearCols, gearMain, interpolStep, rank;
var wheelWidth, wheelHeight, wheelDisk;
var crossMethod = 0; // 0-linear, 1-polynomial
var obs = [];
var moms = [];
var gearNumbers = [];
var engine;
var engineDraw, gearsDraw;
var svgExists = false;
var drawWidth, drawHeight;
var colors = ["#E040FB", "#E91E63", "#536DFE", "#E64A19", "#FFA000", "#795548", "#00796B"];

$(function() {

	initialize();
	
	$("#obFrom").change(function() {
		obFrom = parseFloat($(this).val());
		createObTable();
	});
	
	$("#obTo").change(function() {
		obTo = parseFloat($(this).val());
		createObTable();
	});
	
	$("#obCols").change(function() {
		obCols = $(this).val();
		if (obCols < 4) {
			$(this).val(4);
			obCols = 4;
			alert("Количество известных точек должно быть не меньше четырех!")
		}
		createObTable();
	});
	
	$("#interpolStep").change(function() {
		interpolStep = parseFloat($(this).val());
		createObTable();
	});
	
	$("#gearCols").change(function() {
		gearCols = parseInt($(this).val());
		createGearTable();
	});
	
	$("#gearMain").change(function() {
		gearMain = parseFloat($(this).val());
	});
	
	$("#wheelWidth").change(function() {
		wheelWidth = parseFloat($(this).val());
	});
	
	$("#wheelHeight").change(function() {
		wheelHeight = parseFloat($(this).val());
	});
	
	$("#wheelDisk").change(function() {
		wheelDisk = parseFloat($(this).val());
	});
	
	$("#bWOutInterpol").click(wOutInterpol);
	$("#bWInterpol").click(wInterpol);
	$("#bLine").click(crossLine);
	$("#bPoly").click(crossPoly);
	
}); // start
//------------------------------------------------------

function initialize() {
	
	obFrom = 2000;
	$("#obFrom").val(obFrom);

	obTo = 9000;
	$("#obTo").val(obTo);

	obCols = 15;
	$("#obCols").val(obCols);
	
	gearCols = 5;
	$("#gearCols").val(gearCols);
	
	gearMain = 4.9;
	$("#gearMain").val(gearMain);
	
	interpolStep = 50;
	$("#interpolStep").val(interpolStep);
	
	
	wheelWidth = 185;
	$("#wheelWidth").val(wheelWidth);
	wheelHeight = 70;
	$("#wheelHeight").val(wheelHeight);
	wheelDisk = 14;
	$("#wheelDisk").val(wheelDisk);
	
	obs = [2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000, 7500, 8000, 8500, 9000];
	moms = [92, 92, 101, 108, 120, 132, 134, 136, 133, 132, 125, 117, 107, 88, 56];
	gearNumbers = [2.92, 2.05, 1.56, 1.31, 1.13];
	
	createObTable();
	createGearTable();

   engine = new Engine();
	
	drawWidth = $("#engineDraw").width();
	drawHeight = 600;
	if (SVG.supported) {
		engineDraw = SVG("engineDraw").size("100%", drawHeight);
		gearsDraw = SVG("gearsDraw").size("100%", drawHeight);
		svgExists = true;
	} else {
	  alert('SVG не поддерживается. Графики рисоваться не будут.');
	}
	
} // initialize
//------------------------------------------------------

function getRank() {
	
	//console.log("start get rank");
	rank = Math.round((obTo - obFrom) / interpolStep);
	//console.log("end get rank=" + rank);
	
} // getRank
//------------------------------------------------------

function roundForInterpol(value) {
	
	var result = Math.round(value / interpolStep) * interpolStep;
	return result > obTo ? obTo : result;
	
} // roundForInterpol
//------------------------------------------------------

function createObTable() {
	
	var html = "<table class='table table-bordered'>";
	var header = "";
	var body = "";
	var obStep = parseFloat((obTo - obFrom) / (obCols - 1.0));
	//console.log(obStep);
	var obCurr;
	var c;

	getRank();
	obs.length = obCols;
	moms.length = obCols;
	
	header = "<tr><th>Обороты</th>";
	body = "</tr><tr><td>Момент</td>";
	obCurr = obFrom;
	for (c = 0; c < obCols; c++) {
		obs[c] = roundForInterpol(obCurr);
		header += "<th id='ob" + c + "'>" + obs[c] + "</th>";
		body += "<td><input id='mom" + c + "' type='number' value='" + moms[c] + "'></td>";
		obCurr += obStep;
      //console.log(obCurr);
	}
	
	html += header + "</tr>" + body + "</tr></table>";
	
	$("#obTable").html(html);
	
} // createObTable
//------------------------------------------------------

function createGearTable() {
	
	var html = "<table class='table table-bordered'>";
	var header = "";
	var body = "";
	var gearCurr = 0;
	
	gearNumbers.length = gearCols;
	
	header = "<tr><th>Передача</th>";
	body = "<tr><td>Передаточное число</td>";
	for (gearCurr = 1; gearCurr <= gearCols; gearCurr++) {
		header += "<th style='background-color: " + colors[gearCurr] + "'>" + gearCurr + "</th>";
		body += "<td><input id='gearNumber" + (gearCurr - 1) + "' type='number' value='" + gearNumbers[gearCurr - 1] + "'></td>";
	}
	html += header + "</tr>" + body + "</tr></table>";
	
	$("#gearTable").html(html);
	
} // createGearTable
//------------------------------------------------------

function getMoms() {
	for (var c = 0; c < obCols; c++)
		moms[c] = parseFloat($("#mom" + c).val());
} // getMoms
//------------------------------------------------------

function getGearNumbers() {
	for (var c = 0; c < gearCols; c++)
		gearNumbers[c] = parseFloat($("#gearNumber" + c).val());
} // getGearNumbers
//------------------------------------------------------

function interpolSpline3(ob, mom, secondIndex) { // interpolation of 3 power spline
	
	var h = new Array(obCols);
	var l = new Array(obCols);
	var lambda = new Array(obCols);
	var delta = new Array(obCols);
	var b = new Array(obCols);
	var c = new Array(obCols);
	var d = new Array(obCols);
		
	// h & l
	var k, cc, x, prevIndex;
		
	//console.log("second index=" + this.secondIndex);
	
	prevIndex = 0;
	k = 1;
	for (cc = secondIndex; cc <= rank; cc++) {
		if (mom[cc] == 0.0)
			continue;
		h[k] = ob[cc] - ob[prevIndex];
		//console.log(k + " - h=" + h[k] + "; ob[cc]=" + this.ob[cc] + "; ob[prevIndex]=" + this.ob[prevIndex]);
		if (h[k] == 0) {
			alert("Ошибка интерполяции: x[" + ob[cc] + "]=x[" + ob[prevIndex] + "] - продолжение невозможно!");
			return;
		}
		l[k] = (mom[cc] - mom[prevIndex]) / h[k];
		//console.log(k + " - l=" + l[k]);
		prevIndex = cc;
		k++;
	}
	
	// delta & lambda
	delta[1] = - h[2] / (2.0 * (h[1] + h[2]));
	lambda[1] = 1.5 * (l[2] - l[1]) / (h[1] + h[2]);
	//console.log("delta=" + this.delta[1]);
	//console.log("lambda=" + this.lambda[1]);
	for (k = 3; k < obCols; k++) {
		delta[k - 1] = - h[k] / (2.0 * h[k - 1] + 2.0 * h[k] + h[k - 1] * delta[k - 2]);
		lambda[k - 1] = (3.0 * l[k] - 3.0 * l[k - 1] - h[k - 1] * lambda[k - 2]) /
			(2.0 * h[k - 1] + 2.0 * h[k] + h[k - 1] * delta[k - 2]);
		//console.log("delta=" + delta[k-1]);
		//console.log("lambda=" + lambda[k-1]);
	}
	
	// c, b & d
	c[0] = 0;
	c[obCols - 1] = 0;
	for (k = obCols - 1; k >= 2; k--) {
		c[k - 1] = delta[k - 1] * c[k] + lambda[k - 1];
		//console.log(k + " - c=" + this.c[k-1]);
	}
	for (k = 1; k < obCols; k++) {
		d[k] = (c[k] - c[k - 1]) / (3.0 * h[k]);
		b[k] = l[k] + (2.0 * c[k] * h[k] + h[k] * c[k-1]) / 3.0;
		//console.log(k + " - b=" + this.b[k]);
		//console.log(k + " - d=" + this.d[k]);
	}
	
	// interpolation
	prevIndex = rank;
	k = obCols - 1;
	for (cc = rank - 1; cc > 0; cc--) {
		if (mom[cc] != 0.0) {
			k--;
			prevIndex = cc;
			continue;
		}
		x = ob[cc] - ob[prevIndex];
		mom[cc] = mom[prevIndex] + b[k] * x + c[k] * x * x + d[k] * x * x * x;
		//console.log(cc + " - mom=" + this.mom[cc] + "; x=" + x + "; b=" + b[k] + "; c=" + c[k] + "; d=" + d[k]);
	}
	
} // interpolSpline3
//------------------------------------------------------

function clearEngineDraw() {
	
	engineDraw.rect(drawWidth, drawHeight).fill("#ddddff");
	
} // clearEngineDraw
//------------------------------------------------------

function clearGearsDraw() {
	
	gearsDraw.rect(drawWidth, drawHeight).fill("#ddffdd");
	
} // clearGearsDraw
//------------------------------------------------------

function Engine() {
	
	//console.log("start create engine");
	this.gears = [];
	
	this.getWheelDiametr = function() {
		
		//console.log("start calc calcWheelDiametr");
		return (wheelWidth * wheelHeight * 2.0 / 100.0 + 25.4 * wheelDisk) / 1000.0;
		console.log("end calc calcWheelDiametr. wheelDiametr = " + this.wheelDiametr);
		
	} // getWheelDiametr
	
	this.createGears = function() {
		
		this.gears = new Array(this.gearCols);
		//console.log("start create gears");
		//console.log("rank=" + rank);
		//console.log(this.gearCols);
		for (var c = 0; c < this.gearCols; c++)
			this.gears[c] = new Gear(c, this);
		
	} // createGears
	
	this.initialize = function() {
		
		this.gearCols = gearNumbers.length;
		this.ob = new Array(rank);
		this.mom = new Array(rank);
		this.wheelDiametr = this.getWheelDiametr();
		this.momMax = 0.0;
		this.obGearsMin = -1, this.obGearsMax = -1;
		this.momGearsMin = -1, this.momGearsMax = -1;
		
		getMoms();
		getGearNumbers();
		
		var c = 0;
		obCurr = obs[0];
		obC = obCurr;
		for (k = 0; k <= rank; k++) {
			//console.log("obC=" + obC + "; c=" + c + "; k=" + k + "; obCurr=" + obCurr + "; ob[k]=" + this.ob[k] + "; mom[k]=" + this.mom[k] + "; interpolStep=" + interpolStep);
			this.ob[k] = obCurr; // x for draw
			
			if (obC != obCurr) {
				obCurr += interpolStep;
				this.mom[k] = 0.0;
				continue;
			}
			
			this.mom[k] = moms[c]; // y for draw
			
			if (this.momMax < this.mom[k])
				this.momMax = this.mom[k];
			//console.log("obC=" + obC + "; c=" + c + "; k=" + k + "; obCurr=" + obCurr + "; ob[k]=" + this.ob[k] + "; mom[k]=" + this.mom[k] + "; interpolStep=" + interpolStep);
			
			if (c == 1)
				this.secondIndex = k;
			
			obCurr += interpolStep;
			c++;
			obC = obs[c];
		}
		
		this.createGears();
		
	} // initialize
	
	this.interpol = function() {
		
		interpolSpline3(this.ob, this.mom, this.secondIndex);

	} // interpol

   this.gearInitialize = function() {

      for (var c = 0; c < this.gearCols; c++)
         this.gears[c].initialize();

   } // gearInitialize
	
	this.drawMomentum = function() {
		var coords = "";
		var x, y;
		
		if (!svgExists)
			return;
		
		clearEngineDraw();
		
		for (var c = 0; c <= rank; c++) {
			if (this.mom[c] == 0.0)
				continue;
			//console.log("engineDraw size - " + $("#engineDraw").width() + " : " + drawHeight);
			//console.log("max of mom - " + this.momMax);
			x = Math.round((drawWidth - 40) / (obTo - obFrom) * (this.ob[c] - obFrom) + 20);
			y = Math.round(drawHeight - 40 - (drawHeight - 40) / this.momMax * this.mom[c] + 20);
			coords += " " + x + " " + y;
			//console.log(coords);
		}
		
		engineDraw.polyline(coords).fill("none").stroke({color: colors[0], width: 1});
		
	} // drawMomentum
	
	this.drawGears = function() {
		
		if (!svgExists)
			return;
		
		clearGearsDraw();
		for (var c = 0; c < this.gearCols; c++)
			this.gears[c].drawGear();
		
	} // drawGears
	
	this.findCross = function() {
		
		var lastC;
		var sResult = "";
		var oborot;
		
		// find point between which exists cross 
		for (var k = 1; k < this.gearCols; k++) {
			lastC = 0;
			oborot = -1;
			//console.log("interval #" + (k-1) + " rank=" + rank);
			for (var c = 1; c <= rank; c++) {
				if (this.gears[k].mom[c] == 0.0)
					continue;

				// find crossing interval of ob previous Gears
				lastCC = 0;
				for (var cc = 1; cc <= rank; cc++) {
					if (this.gears[k-1].mom[cc] == 0.0)
						continue;
					
					//console.log(this.gears[k-1].ob[lastCC] + ", " + this.gears[k-1].ob[cc] + " -=- " + this.gears[k].ob[lastC] + ", " + this.gears[k].ob[c]);
					
					if (this.gears[k-1].ob[cc] < this.gears[k].ob[lastC]) {
						lastCC = cc;
						//console.log("continue before crossing");
						continue;
					}
					
					crossExists = false;
					
					if (this.gears[k-1].ob[lastCC] > this.gears[k].ob[c]) {
						//console.log("x11=" + this.gears[k-1].ob[lastCC] + "; x21=" + this.gears[k].ob[lastC] + "; x12=" + this.gears[k-1].ob[cc] + "; x22=" + this.gears[k].ob[c]);
						//console.log("max=" + Math.max(this.gears[k-1].ob[lastCC], this.gears[k].ob[lastC]) + "; min=" + Math.min(this.gears[k-1].ob[cc], this.gears[k].ob[c]));
						//console.log("break before crossing");
						break;
					}
				
					// found this interval
					//crossExists = (this.gears[k-1].mom[lastCC] > this.gears[k].mom[lastC]) != (this.gears[k-1].mom[cc] > this.gears[k].mom[c]);
					crossExists = Math.max(this.gears[k-1].ob[lastCC], this.gears[k].ob[lastC]) <= Math.min(this.gears[k-1].ob[cc], this.gears[k].ob[c]);
					//console.log("cross result = " + crossExists);
					if (crossExists) {
						//console.log("x11=" + this.gears[k-1].ob[lastCC] + "; x21=" + this.gears[k].ob[lastC] + "; x12=" + this.gears[k-1].ob[cc] + "; x22=" + this.gears[k].ob[c]);
						//console.log("max=" + Math.max(this.gears[k-1].ob[lastCC], this.gears[k].ob[lastC]) + "; min=" + Math.min(this.gears[k-1].ob[cc], this.gears[k].ob[c]));
						//console.log("y11=" + this.gears[k-1].mom[lastCC] + "; y21=" + this.gears[k].mom[lastC] + "; y12=" + this.gears[k-1].mom[cc] + "; y22=" + this.gears[k].mom[c]);
						//console.log("c=" + c);
						//console.log("x13=" + this.gears[k-1].ob[cc+1] + "; x23=" + this.gears[k].ob[c+1]);
						//console.log("y13=" + this.gears[k-1].mom[cc+1] + "; y23=" + this.gears[k].mom[c+1]);
						res = this.findCrossPoint(
								this.gears[k-1].ob[lastCC],
								this.gears[k-1].mom[lastCC],
								this.gears[k-1].ob[cc],
								this.gears[k-1].mom[cc],
								this.gears[k].ob[lastC],
								this.gears[k].mom[lastC],
								this.gears[k].ob[c],
								this.gears[k].mom[c],
								0);
						//console.log(res.x + " -===- " + res.y);
						if (res.x != 0.0) {
							oborot = Math.round(res.x / 60.0 / 3.14 / this.wheelDiametr * gearMain * gearNumbers[k-1] * 1000.0);
							//console.log("break after crossing");
							break;
						}
					}
					lastCC = cc;
					//console.log("continue after crossing");
				}
				if (crossExists)
					break;
				lastC = c;
			}
			
			// if gears not crossing, find value (y) of greater gear from last oborot (x) of lesser gear  
			if (oborot == -1) {
				lastC = 0;
				for (var c = 1; c <= rank; c++) {
					if (this.gears[k].mom[cc] == 0.0)
						continue;
					
					if ((this.gears[k].ob[lastC] <= this.gears[k-1].ob[rank]) && (this.gears[k-1].ob[rank] <= this.gears[k].ob[c])) {
						oborot = Math.round(this.gears[k-1].ob[rank] / 60.0 / 3.14 / this.wheelDiametr * gearMain * gearNumbers[k-1] * 1000.0);
						break;
					}
					
					lastC = c;
				}
			}
			
			if (oborot != -1) {
				sResult += sResult == "" ? "" : "<br />";
				sResult += "С " + k + " передачи на " + (k + 1) + " передачу следует переключаться при " + oborot + " оборотах двигателя";
			}
			else {
				sResult += sResult == "" ? "" : "<br />";
				sResult += "Между " + k + " передачей и " + (k + 1) + " передачей нет ни пересечений, ни вообще общих интервалов оборотов двигателя";
			}
				
		}
		
		return sResult;
		
	} // findCross
		
	this.findCrossPoint = function(x11, y11, x12, y12, x21, y21, x22, y22, method) {
		var x, y;
		
		switch (method) {
			case 0:
				if ((x11 == x12) || (x21 == x22)) {
					//console.log("Невозможно посчитать пересечение!");
					x = 0.0;
					break;
				}
				// less gear
				a1 = (y11 - y12) / (x11 - x12);
				b1 = y11 - a1 * x11;
					
				// great gear
				a2 = (y21 - y22) / (x21 - x22);
				b2 = y21 - a2 * x21;
					
				if (a1 == a2) {
					//console.log("Невозможно посчитать пересечение, т. к. линии параллельны!");
					x = 0.0;
					break;
				}
				
				// cross point
				x = (b2 - b1) / (a1 - a2);
				y = a1 * x + b1;
				
				if ((Math.max(x11, x21) >= x) || (x >= Math.min(x12, x22)))
					x = 0.0;
				
				//console.log(x11 + ", " + x21 + " <= " + x + " <= " + x12 + ", " + x22);
				
				break;
		};
		
		return {"x": x, "y": y};
	} // findCrossPoint
	
 } // Engine
//------------------------------------------------------

function Gear(num, parent) {
	
	this.gearNumber = num;
	this.parent = parent;
	
    //console.log("start create gear #" + this.gearNumber + " rank=" + rank);
	
	this.initialize = function() {
		
		this.ob = new Array(rank);
	    this.mom = new Array(rank);
	    
	    var c, k, obCurr;
		
		c = 0;
		for (k = 0; k <= rank; k++) {
			this.ob[k] = this.parent.ob[k] / gearNumbers[this.gearNumber] / gearMain * 60.0 * 3.14 * this.parent.wheelDiametr / 1000.0; // x
			
			if (this.parent.obGearsMin == -1)
				this.parent.obGearsMin = this.ob[k];
			else
				if (this.parent.obGearsMin > this.ob[k])
					this.parent.obGearsMin = this.ob[k];
			
			if (this.parent.obGearsMax == -1)
				this.parent.obGearsMax = this.ob[k];
			else
				if (this.parent.obGearsMax < this.ob[k])
					this.parent.obGearsMax = this.ob[k];
			
			if (this.parent.mom[k] == 0.0) {
				this.mom[k] = 0.0;
				continue;
			}
			
			this.mom[k] = this.parent.mom[k] * gearNumbers[this.gearNumber] * gearMain / 4.0 / this.parent.wheelDiametr; // y
			
			if (this.parent.momGearsMin == -1)
				this.parent.momGearsMin = this.mom[k];
			else
				if (this.parent.momGearsMin > this.mom[k])
					this.parent.momGearsMin = this.mom[k];
			
			if (this.parent.momGearsMax == -1)
				this.parent.momGearsMax = this.mom[k];
			else
				if (this.parent.momGearsMax < this.mom[k])
					this.parent.momGearsMax = this.mom[k];
			
			//console.log("gearNumbers=" + gearNumbers[this.gearNumber] + "; wheelDiametr=" + this.parent.wheelDiametr + "; k=" + k + "; parent.mom=" + this.parent.mom[k] + "; ob[k]=" + this.ob[k] + "; mom[k]=" + this.mom[k]);
			//console.log(this.wheelDiametr + " - " + this.mom[k]);
			if (c == 1)
				this.secondIndex = k;
			c++;
		}
		
	} // initialize
	
	this.drawGear = function() {
		
		var coords = "";
		var x, y;
		
		if (!svgExists)
			return;
		
		//console.log("start drawing gear #" + this.gearNumber);
		for (var c = 0; c <= rank; c++) {
			if (this.mom[c] == 0.0)
				continue;
			//console.log("min=" + this.parent.obGearsMin + "; max=" + this.parent.obGearsMax);
			//console.log("max of mom - " + this.momMax);
			x = Math.round((drawWidth - 40) / (this.parent.obGearsMax - this.parent.obGearsMin) * (this.ob[c] - this.parent.obGearsMin) + 20);
			y = Math.round(drawHeight - 40 - (drawHeight - 40) / (this.parent.momGearsMax - this.parent.momGearsMin) * (this.mom[c] - this.parent.momGearsMin) + 20);
			coords += " " + x + " " + y;
			//console.log(coords);
		}
		
		gearsDraw.polyline(coords).fill("none").stroke({color: colors[this.gearNumber+1], width: 1});
		
	} // drawGear

} // Gear
//------------------------------------------------------

function wOutInterpol() {
	
	engine.initialize();
   engine.gearInitialize();
	engine.drawMomentum();
	engine.drawGears();
	
} // wOutInterpol
//------------------------------------------------------

function wInterpol() {
	
	engine.initialize();
	engine.interpol();
   engine.gearInitialize();
	engine.drawMomentum();
	engine.drawGears();
	
} // wInterpol
//------------------------------------------------------

function crossLine() {
	
	engine.crossMethod = 0;
	sResult = engine.findCross();
	$("#resTable").html(sResult);
	
} // crossLine
//------------------------------------------------------

function crossPoly() {
	
	engine.crossMethod = 1;
	sResult = engine.findCross();
	$("#resTable").html(sResult);
	
} // crossPoly
//------------------------------------------------------