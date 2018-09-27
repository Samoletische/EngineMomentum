/**
 * 
 */
var obFrom = 2000, obTo = 9000, obCols = 15, interpolStep = 50, gearCols = 5, wheelDiametr = 0;
var gears = [];
var moms = [92, 92, 101, 108, 120, 132, 134, 136, 133, 132, 125, 117, 107, 88, 56];
var gearNumbers = [2.92, 2.05, 1.56, 1.31, 1.13];

$(function() {
	createObTable();
	createGearTable();
	
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
	
	$("#bCalc").click(calculate);
});
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
}
//------------------------------------------------------

function roundForInterpol(value) {
	var result = Math.round(value / interpolStep) * interpolStep;
	return result > obTo ? obTo : result; 
}
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
}
//------------------------------------------------------

function calculate() {
	calcWheelDiametr();
	createGears();
	drawFunctions();
	findCross();
}
//------------------------------------------------------

function calcWheelDiametr() {
	var wheelWidth = parseFloat($("#wheelWidth").val());
	var wheelHeight = parseFloat($("#wheelHeight").val());
	var wheelDisk = parseFloat($("#wheelDisk").val());
	
	wheelDiametr = (wheelWidth * wheelHeight * 2.0 / 100.0 + 25.4 * wheelDisk) / 1000.0;
}
//------------------------------------------------------

function createGears() {
	for (var c = 0; c < gearCols; c++)
		gears[c] = new Gear(c);
}
//------------------------------------------------------

function drawFunctions() {
	var draw = SVG("drawing").size("100%", 600);
	var rect = draw.rect(100, 100).move(100, 50).attr({ fill: '#004411'});
}
//------------------------------------------------------

function findCross() {
	
}
//------------------------------------------------------

function Gear(num) {
	var c, k, obCurr;
	
	// initialization
	this.rank = Math.round((obTo - obFrom) / interpolStep);
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
	for (k = 0; k < this.rank; k++) {
		this.ob[k] = obCurr / parseFloat($("#gearNumber"+num).val()) / parseFloat($("#gearMain").val()) * 60.0 * 3.14 * wheelDiametr / 1000.0; // x
		
		if (obC != obCurr) {
			obCurr += interpolStep;
			this.mom[k] = 0.0;
			continue;
		}
		
		this.mom[k] = $("#mom"+c).val() * $("#gearNumber"+num).val() * $("#gearMain").val() / 4.0 / wheelDiametr; // y
		if (c == 1)
			this.secondIndex = k;
		obCurr += interpolStep;
		c++;
		obC = parseFloat($("#ob"+c).text());
	}
	
	// interpolation
	this.interpol = function() {
		// interpolation of 3 power spline
		// h & l
		var k, c, x, prevIndex;
		
		prevIndex = 0;
		k = 1;
		for (c = this.secondIndex; c < this.rank; c++) {
			if (this.mom[c] == 0.0)
				continue;
			this.h[k] = this.ob[c] - this.ob[prevIndex];
			if (this.h[k] == 0) {
				alert("Ошибка интерполяции: x[" + this.ob[c] + "]=x[" + this.ob[prevIndex] + "] - продолжение невозможно!");
				return;
			}
			this.l[k] = (this.mom[c] - this.mom[prevIndex]) / this.h[k];
			prevIndex = c;
			k++;
		}
		
		// delta & lambda
		this.delta[1] = - this.h[2] / (2.0 * (this.h[1] + this.h[2]));
		this.lambda[1] = 1.5 * (this.l[2] - this.l[1]) / (this.h[1] + this.h[2]);
		for (k = 3; k < obCols; k++) {
			this.delta[k - 1] = - this.h[k] / (2.0 * this.h[k - 1] + 2.0 * this.h[k] + this.h[k - 1] * this.delta[k - 2]);
			this.lambda[k - 1] = (3.0 * this.l[k] - 3.0 * this.l[k - 1] - this.h[k - 1] * this.lambda[k - 2]) /
				(2.0 * this.h[k - 1] + 2.0 * this.h[k] + this.h[k - 1] * this.delta[k - 2]);
		}
		
		// c, b & d
		this.c[0] = 0;
		this.c[N - 1] = 0;
		for (k = obCols - 1; k >= 2; k--)
			this.c[k - 1] = this.delta[k - 1] * this.c[k] + this.lambda[k - 1];
		for (k = 1; k < obCols; k++) {
			this.d[k] = (this.c[k] - this.c[k - 1]) / (3.0 * this.h[k]);
			this.b[k] = this.l[k] + (2.0 * this.c[k] * this.h[k] + this.h[k] * this.c[k-1]) / 3.0;
		}
		
		// interpolation
		prevIndex = this.rank - 1;
		k = obCols;
		for (c = this.rank - 2; c > 0; c--) {
			if (this.mom[c] != 0.0) {
				k--;
				prevIndex = c;
				continue;
			}
			x = this.ob[c] - this.ob[prevIndex];
			this.mom[c] = this.mom[prevIndex] + this.b[k] * x + this.c[k] * x * x + this.d[k] * x * x * x;
		}
	};
	
	// draw
	this.draw = function() {
		
	};
}
//------------------------------------------------------