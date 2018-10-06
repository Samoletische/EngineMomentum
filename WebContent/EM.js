/**
 * 
 */
var obFrom = 2000, obTo = 9000, obCols = 15, interpolStep = 50, gearCols = 5;
var moms = [92, 92, 101, 108, 120, 132, 134, 136, 133, 132, 125, 117, 107, 88, 56];
var gearNumbers = [2.92, 2.05, 1.56, 1.31, 1.13];
var engine;

$(function() {
	engine = new Engine();

	createObTable();
	createGearTable();
	
	$("#obFrom").change(function() {
		obFrom = $(this).val();
		engine.rank = engine.getRank();
		createObTable();
	});
	
	$("#obTo").change(function() {
		obTo = $(this).val();
		engine.rank = engine.getRank();
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
		engine.rank = engine.getRank();
		createObTable();
	});
	
	$("#gearCols").change(function() {
		engine.gearCols = $(this).val();
		createGearTable();
	});
	
	$("#bWOutInterpol").click(wOutInterpol);
	$("#bWInterpol").click(wInterpol);
	$("#bLine").click(crossLine);
	$("#bPoly").click(crossPoly);
}); // start
//------------------------------------------------------

function Engine() {
	//console.log("start create engine");
	
	this.gears = [];
	this.gearCols = $("#gearCols").val();
	this.wheelDiametr = 0;
	this.crossMethod = 0; // 0-linear, 1-polynomial

	this.getRank = function() {
		//console.log("start get rank");
		this.rank = Math.round((obTo - obFrom) / interpolStep);
		//console.log("end get rank=" + this.rank);
	};
	
	this.rank = this.getRank();
	
	this.calcWheelDiametr = function() {
		//console.log("start calc calcWheelDiametr");
		var wheelWidth = parseFloat($("#wheelWidth").val());
		var wheelHeight = parseFloat($("#wheelHeight").val());
		var wheelDisk = parseFloat($("#wheelDisk").val());
	
		this.wheelDiametr = (wheelWidth * wheelHeight * 2.0 / 100.0 + 25.4 * wheelDisk) / 1000.0;
		//console.log("end calc calcWheelDiametr. wheelDiametr = " + this.wheelDiametr);
	};
	
	this.Gear = function(num, rank, wheelDiametr) {
      this.rank = rank;
      this.wheelDiametr = wheelDiametr;
		console.log("start create gear #" + num + " rank=" + this.rank);
		
		var c, k, obCurr;
		
		// initialization
		this.ob = new Array(this.rank);
		this.mom = new Array(this.rank);
		
		this.h = new Array(obCols);
		this.l = new Array(obCols);
		this.lambda = new Array(obCols);
		this.delta = new Array(obCols);
		this.b = new Array(obCols);
		this.c = new Array(obCols);
		this.d = new Array(obCols);
		this.secondIndex = 1;
		
		// implementation
		c = 0;
		obCurr = obFrom;
		obC = parseFloat($("#ob0").text());
		for (k = 0; k <= this.rank; k++) {
			this.ob[k] = obCurr / parseFloat($("#gearNumber"+num).val()) / parseFloat($("#gearMain").val()) * 60.0 * 3.14 * this.wheelDiametr / 1000.0; // x
			
			if (obC != obCurr) {
				obCurr += interpolStep;
				this.mom[k] = 0.0;
				//this.mom[k] = "null";
				continue;
			}
			
			this.mom[k] = $("#mom"+c).val() * $("#gearNumber"+num).val() * $("#gearMain").val() / 4.0 / this.wheelDiametr; // y
			//console.log("obC=" + obC + "; c=" + c + "; k=" + k + "; obCurr=" + obCurr + "; ob[k]=" + this.ob[k] + "; mom[k]=" + this.mom[k]);
			//console.log(this.wheelDiametr + " - " + this.mom[k]);
			if (c == 1)
				this.secondIndex = k;
			obCurr += interpolStep;
			c++;
			obC = parseFloat($("#ob"+c).text());
		}
		
		// draw
		this.draw = function() {
			for (var c = 0; c <= this.rank; c++)
				console.log(this.ob[c] + " - " + this.mom[c]);
		};
		
		// interpolation
		this.interpol = function() {
			// interpolation of 3 power spline
			// h & l
			var k, c, x, prevIndex;
			
			//console.log("second index=" + this.secondIndex);
			prevIndex = 0;
			k = 1;
			for (c = this.secondIndex; c <= this.rank; c++) {
				if (this.mom[c] == 0.0)
				//if (this.mom[c] == "null")
					continue;
				this.h[k] = this.ob[c] - this.ob[prevIndex];
				//console.log(k + " - h=" + this.h[k]);
				if (this.h[k] == 0) {
					alert("Ошибка интерполяции: x[" + this.ob[c] + "]=x[" + this.ob[prevIndex] + "] - продолжение невозможно!");
					return;
				}
				this.l[k] = (this.mom[c] - this.mom[prevIndex]) / this.h[k];
				//console.log(k + " - l=" + this.l[k]);
				prevIndex = c;
				k++;
			}
			
			// delta & lambda
			this.delta[1] = - this.h[2] / (2.0 * (this.h[1] + this.h[2]));
			this.lambda[1] = 1.5 * (this.l[2] - this.l[1]) / (this.h[1] + this.h[2]);
			//console.log("delta=" + this.delta[1]);
			//console.log("lambda=" + this.lambda[1]);
			for (k = 3; k < obCols; k++) {
				this.delta[k - 1] = - this.h[k] / (2.0 * this.h[k - 1] + 2.0 * this.h[k] + this.h[k - 1] * this.delta[k - 2]);
				this.lambda[k - 1] = (3.0 * this.l[k] - 3.0 * this.l[k - 1] - this.h[k - 1] * this.lambda[k - 2]) /
					(2.0 * this.h[k - 1] + 2.0 * this.h[k] + this.h[k - 1] * this.delta[k - 2]);
				//console.log("delta=" + this.delta[k-1]);
				//console.log("lambda=" + this.lambda[k-1]);
			}
			
			// c, b & d
			this.c[0] = 0;
			this.c[obCols - 1] = 0;
			for (k = obCols - 1; k >= 2; k--) {
				this.c[k - 1] = this.delta[k - 1] * this.c[k] + this.lambda[k - 1];
				//console.log(k + " - c=" + this.c[k-1]);
			}
			for (k = 1; k < obCols; k++) {
				this.d[k] = (this.c[k] - this.c[k - 1]) / (3.0 * this.h[k]);
				this.b[k] = this.l[k] + (2.0 * this.c[k] * this.h[k] + this.h[k] * this.c[k-1]) / 3.0;
				//console.log(k + " - b=" + this.b[k]);
				//console.log(k + " - d=" + this.d[k]);
			}
			
			// interpolation
			prevIndex = this.rank;
			k = obCols - 1;
			for (c = this.rank - 1; c > 0; c--) {
				if (this.mom[c] != 0.0) {
				//if (this.mom[c] != "null") {
					k--;
					prevIndex = c;
					continue;
				}
				x = this.ob[c] - this.ob[prevIndex];
				this.mom[c] = this.mom[prevIndex] + this.b[k] * x + this.c[k] * x * x + this.d[k] * x * x * x;
				//console.log(c + " - mom=" + this.mom[c]);
			}
			
			//this.draw();
		};
	} // Gear
	
	this.createGears = function() {
		//console.log("start create gears");
      this.getRank();
		//console.log("rank=" + this.rank);
		this.calcWheelDiametr();
		//console.log(this.gearCols);
		for (var c = 0; c < this.gearCols; c++)
			this.gears[c] = new this.Gear(c, this.rank, this.wheelDiametr);
	};
	
	this.interpol = function() {
		this.createGears();
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
		var gz = [];
		var lastC;
		var sResult = "";
		
		// find point between which exists cross 
		for (var k = 1; k < this.gearCols; k++) {
			lastC = 0;
			//console.log("interval #" + (k-1) + " rank=" + this.rank);
			for (var c = 1; c <= this.rank; c++) {
				if (this.gears[k].mom[c] == 0.0)
					continue;

				// find crossing interval of ob previous Gears
				lastCC = 0;
				for (var cc = 1; cc <= this.rank; cc++) {
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
					console.log("cross result = " + crossExists);
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
						console.log(res.x + " -===- " + res.y);
						if (res.x != 0.0) {
							sResult += sResult == "" ? "" : "<br />";
							sResult += "Точка пересечения между " + k + " и " + (k + 1) + " передачами, (об; момент) = (" + res.x + ";" + res.	y + ")";
							break;
						}
					}
					lastCC = cc;
				}
				if (crossExists)
					break;
				lastC = c;
			}
		}
		
		$("#resTable").html(sResult);
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
				
				console.log(x11 + ", " + x21 + " <= " + x + " <= " + x12 + ", " + x22);
				
				break;
		};
		
		return {"x": x, "y": y};
	};
 } // Engine
//------------------------------------------------------

function createObTable() {
	var html = "<table class='table table-bordered'>";
	var header = "";
	var body = "";
	var obStep = parseFloat((obTo - obFrom) / (obCols - 1.0));
	var obCurr = 0;
	var c = 0;
	
	header = "<tr><th>Обороты</th>";
	body = "</tr><tr><td>Момент</td>";
	obCurr = obFrom;
	for (c = 0; c < obCols; c++) {
		header += "<th id='ob" + c + "'>" + roundForInterpol(obCurr) + "</th>";
		body += "<td><input id='mom" + c + "' type='number' value='" + moms[c] + "'></td>";
		obCurr += obStep; 
	}
	
	html += header + "</tr>" + body + "</tr></table>";
	
	$("#obTable").html(html);
} // createObTable
//------------------------------------------------------

function roundForInterpol(value) {
	var result = Math.round(value / interpolStep) * interpolStep;
	return result > obTo ? obTo : result; 
} // roundForInterpol
//------------------------------------------------------

function createGearTable() {
	var html = "<table class='table table-bordered'>";
	var header = "";
	var body = "";
	var gearCurr = 0;
	
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

function wOutInterpol() {
   engine.createGears();
   engine.drawMomentum();
   engine.drawGears();
} // wOutInterpol
//------------------------------------------------------

function wInterpol() {
   engine.interpol();
   engine.drawMomentum();
   engine.drawGears();
} // wInterpol
//------------------------------------------------------

function crossLine() {
   engine.crossMethod = 0;
   engine.findCross();
} // crossLine
//------------------------------------------------------

function crossPoly() {
   engine.crossMethod = 1;
   engine.findCross();
} // crossPoly
//------------------------------------------------------

function drawFunctions() {
	var draw = SVG("drawing").size("100%", 600);
	var rect = draw.rect(100, 100).move(100, 50).attr({ fill: '#004411'});
} // drawFunctions
//------------------------------------------------------
