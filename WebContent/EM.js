/**
 * 
 */
var obFrom = 2000, obTo = 9000, obCols = 15;

$(function() {
	createObTable();
	
	$("#obFrom").change(function() {
		obFrom = $(this).val();
		createObTable()
	});
	
	$("#obTo").change(function() {
		obTo = $(this).val();
		createObTable()
	});
	
	$("#obCols").change(function() {
		obCols = $(this).val();
		createObTable()
	});
});
//------------------------------------------------------

function createObTable() {
	var html = "<table class='table table-bordered'>";
	var header = "";
	var body = "";
	var obStep = Math.round((obTo - obFrom) / (obCols - 1));
	var obCurr = 0;
	var c = 0;
	
	console.log(obTo);
	
	header = "<tr><th>Обороты</th>";
	body = "</tr><tr><td>Момент</td>";
	for (obCurr = obFrom; obCurr <= obTo; obCurr+=obStep) {
		header += "<th id='ob" + c + "'>" + obCurr + "</th>";
		body += "<td id='mom" + c + "'><input type='number'></td>";
		c++;
	}
	if (obCurr - obStep != obTo) {
		header += "<th id='ob" + c + "'>" + obTo + "</th>";
		body += "<td id='mom" + c + "'><input type='number'></td>";
	}
		
	html += header + "</tr>" + body + "</tr></table>";
	
	$("#obTable").html(html);
}