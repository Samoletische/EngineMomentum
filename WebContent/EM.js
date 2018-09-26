/**
 * 
 */
var obFrom = 2000, obTo = 9000, obCols = 15, gearCols = 5, wheelDiametr = 0;
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
	var obStep = Math.round((obTo - obFrom) / (obCols - 1));
	var obCurr = 0;
	var c = 0;
	
	header = "<tr><th>Обороты</th>";
	body = "</tr><tr><td>Момент</td>";
	for (obCurr = obFrom; obCurr <= obTo; obCurr+=obStep) {
		header += "<th id='ob" + c + "'>" + obCurr + "</th>";
		body += "<td><input id='mom" + c + "' type='number' value='" + moms[c] + "'></td>";
		c++;
	}
	if (obCurr - obStep != obTo) {
		header += "<th id='ob" + c + "'>" + obTo + "</th>";
		body += "<td><input id='mom" + c + "' type='number' value='" + moms[c] + "'></td>";
	}
		
	html += header + "</tr>" + body + "</tr></table>";
	
	$("#obTable").html(html);
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
	var c;
	
	for (c = 0; c < gearCols; c++)
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
	var c;
	
	this.ob = new Array(obCols);
	this.mom = new Array(obCols);
	for (c = 0; c < obCols; c++) {
		this.ob[c] = parseFloat($("#ob"+c).text()) / parseFloat($("#gearNumber"+num).val()) / parseFloat($("#gearMain").val()) * 60.0 * 3.14 * wheelDiametr / 1000.0;
		this.mom[c] = $("#mom"+c).val() * $("#gearNumber"+num).val() * $("#gearMain").val() / 4.0 / wheelDiametr;
	}
}
//------------------------------------------------------