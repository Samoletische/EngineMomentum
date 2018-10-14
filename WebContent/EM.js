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

$(function() {

	initialize();
	
	$("#obFrom").change(function() {
		obFrom = $(this).val();
		createObTable();
	});
	
	$("#obTo").change(function() {
		obTo = $(this).val();
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
		interpolStep = $(this).val();
		createObTable();
	});
	
	$("#gearCols").change(function() {
		gearCols = $(this).val();
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
	
	engineDraw = SVG("engineDraw").size("100%", 600);
	gearsDraw = SVG("gearsDraw").size("100%", 600);
	
}
//------------------------------------------------------

function getRank() {
	
	//console.log("start get rank");
	rank = Math.round((obTo - obFrom) / interpolStep);
	//console.log("end get rank=" + rank);
	
}
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
	console.log(obStep);
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
		header += "<th>" + gearCurr + "</th>";
		body += "<td><input id='gearNumber" + (gearCurr - 1) + "' type='number' value='" + gearNumbers[gearCurr - 1] + "'></td>";
	}
	html += header + "</tr>" + body + "</tr></table>";
	
	$("#gearTable").html(html);
	
} // createGearTable
//------------------------------------------------------

function Engine() {
	
	//console.log("start create engine");
	this.gears = [];
	
	this.getWheelDiametr = function() {
		
		//console.log("start calc calcWheelDiametr");
		return (wheelWidth * wheelHeight * 2.0 / 100.0 + 25.4 * wheelDisk) / 1000.0;
		console.log("end calc calcWheelDiametr. wheelDiametr = " + this.wheelDiametr);
		
	};
	
	this.createGears = function() {
		
		this.gears = new Array(this.gearCols);
		//console.log("start create gears");
		//this.getRank();
		//console.log("rank=" + rank);
		//this.calcWheelDiametr();
		//console.log(this.gearCols);
		for (var c = 0; c < this.gearCols; c++)
			this.gears[c] = new Gear(c, this);
		
	};
	
	this.initialize = function() {
		
		this.gearCols = gearNumbers.length;
		this.ob = new Array(rank);
		this.mom = new Array(rank);
		this.wheelDiametr = this.getWheelDiametr();
		
		var c = 0;
		obCurr = obs[0];
		obC = obCurr;
		for (k = 0; k <= rank; k++) {
			this.ob[k] = obCurr; // x for draw
			
			if (obC != obCurr) {
				obCurr += interpolStep;
				this.mom[k] = 0.0;
				continue;
			}
			
			this.mom[k] = moms[c]; // y for draw
			//console.log("obC=" + obC + "; c=" + c + "; k=" + k + "; obCurr=" + obCurr + "; ob[k]=" + this.ob[k] + "; mom[k]=" + this.mom[k]);
			
			obCurr += interpolStep;
			c++;
			obC = obs[c];
		}
		
		this.createGears();
		
	};
	
	this.initialize();
	
	this.interpol = function() {
		
		for (var c = 0; c < this.gearCols; c++)
			this.gears[c].interpol();
		
	}
	
	this.drawMomentum = function() {
	};
	
	this.drawGears = function(draw) {
		//for (var c = 0; c < this.gearCols; c++)
		//	this.gears[c].draw(draw);
	};
	
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
						//console.log("continue");
						continue;
					}
					if (this.gears[k-1].ob[lastCC] > this.gears[k].ob[c])
						break;
				
					// found this interval
					crossExists = (this.gears[k-1].mom[lastCC] > this.gears[k].mom[lastC]) != (this.gears[k-1].mom[cc] > this.gears[k].mom[c]);
					//console.log("cross result = " + crossExists);
					if (crossExists) {
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
							break;
						}
					}
					lastCC = cc;
				}
				if (crossExists)
					break;
				lastC = c;
			}
			
			// if gears not crossing, find value (y) of greater gear from last oborot (x) of lesser gear  
			if (!crossExists) {
				lastC = 0;
				for (var c = 1; c <= rank; c++) {
					if (this.gears[k].mom[cc] == 0.0)
						continue;
					
					if ((this.gears[k].ob[lastC] <= this.gears[k-1].ob[rank]) && (this.gears[k-1].ob[rank] <= this.gears[k].ob[c])) {
						oborot = Math.round(this.gears[k-1].ob[rank] / 60.0 / 3.14 / this.wheelDiametr * gearMain * gearNumbers[k-1] * 1000.0);
						break;
					}
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
		
	};
		
	this.findCrossPoint = function(x11, y11, x12, y12, x21, y21, x22, y22, method) {
		var x, y;
		
		switch (method) {
			case 0:
				if ((x11 == x12) || (x21 == x22)) {
					alert("Невозможно посчитать пересечение!");
					return;
				}
				// less gear
				a1 = (y11 - y12) / (x11 - x12);
				b1 = y11 - a1 * x11;
					
				// great gear
				a2 = (y21 - y22) / (x21 - x22);
				b2 = y21 - a2 * x21;
					
				if (a1 == a2) {
					alert("Невозможно посчитать пересечение, т. к. линии параллельны!");
					return;
				}
				
				// cross point
				x = (b2 - b1) / (a1 - a2);
				y = a1 * x + b1;
				
				if ((Math.min(x11, x21) > x) || (x > Math.max(x12, x22)))
					x = 0.0;
				
				//console.log(x11 + ", " + x21 + " <= " + x + " <= " + x12 + ", " + x22);
				
				break;
		};
		
		return {"x": x, "y": y};
	};
	
 } // Engine
//------------------------------------------------------

function Gear(num, parent) {
	
	this.gearNumber = num;
	this.parent = parent;
	
    console.log("start create gear #" + this.gearNumber + " rank=" + rank);
		
    this.ob = new Array(rank);
    this.mom = new Array(rank);
    
	var c, k, obCurr;
	
	this.initialize = function() {
		
		var c = 0;
		for (k = 0; k <= rank; k++) {
			this.ob[k] = this.parent.ob[k] / gearNumbers[this.gearNumber] / gearMain * 60.0 * 3.14 * this.parent.wheelDiametr / 1000.0; // x
			
			if (this.parent.mom[k] == 0.0) {
				this.mom[k] = 0.0;
				continue;
			}
			
			this.mom[k] = this.parent.mom[k] * gearNumbers[this.gearNumber] * gearMain / 4.0 / this.parent.wheelDiametr; // y
			//console.log("gearNumbers=" + gearNumbers[this.gearNumber] + "; wheelDiametr=" + this.parent.wheelDiametr + "; k=" + k + "; parent.mom=" + this.parent.mom[k] + "; ob[k]=" + this.ob[k] + "; mom[k]=" + this.mom[k]);
			//console.log(this.wheelDiametr + " - " + this.mom[k]);
			if (c == 1)
				this.secondIndex = k;
			c++;
		}
		
	};
	
	this.initialize();
		
	this.drawGear = function() {
		
		for (var c = 0; c <= rank; c++)
			console.log(this.ob[c] + " - " + this.mom[c]);
		
	};
		
	this.interpol = function() { // interpolation of 3 power spline
		
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
		for (cc = this.secondIndex; cc <= rank; cc++) {
			if (this.mom[cc] == 0.0)
				continue;
			h[k] = this.ob[cc] - this.ob[prevIndex];
			//console.log(k + " - h=" + h[k] + "; ob[cc]=" + this.ob[cc] + "; ob[prevIndex]=" + this.ob[prevIndex]);
			if (h[k] == 0) {
				alert("Ошибка интерполяции: x[" + this.ob[cc] + "]=x[" + this.ob[prevIndex] + "] - продолжение невозможно!");
				return;
			}
			l[k] = (this.mom[cc] - this.mom[prevIndex]) / h[k];
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
			if (this.mom[cc] != 0.0) {
				k--;
				prevIndex = cc;
				continue;
			}
			x = this.ob[cc] - this.ob[prevIndex];
			this.mom[cc] = this.mom[prevIndex] + b[k] * x + c[k] * x * x + d[k] * x * x * x;
			//console.log(cc + " - mom=" + this.mom[cc] + "; x=" + x + "; b=" + b[k] + "; c=" + c[k] + "; d=" + d[k]);
		}
		
	};

} // Gear
//------------------------------------------------------

function wOutInterpol() {
	
	engine = new Engine();
	engine.drawMomentum();
	engine.drawGears();
	
} // wOutInterpol
//------------------------------------------------------

function wInterpol() {
	
	engine = new Engine();
	engine.interpol();
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
