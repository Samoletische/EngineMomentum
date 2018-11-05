/**
 * 
 */
var obFrom, obTo, obCols, gearCols, gearMain, gearCols2, gearMain2, interpolStep, rank;
var obFinish, obFinish2;
var wheelWidth, wheelHeight, wheelDisk;
var wheelWidth2, wheelHeight2, wheelDisk2;
var crossMethod = 0; // 0-linear, 1-polynomial
var obs = [];
var moms = [];
var gearNumbers = [];
var gearNumbers2 = [];
var engine;
var engineDraw, gearsDraw;
var svgExists = false;
var drawWidth, drawHeight;
var colors = ["#E040FB", "#940910", "#A50A20", "#B60B30", "#C70C41", "#D80D52", "#E91E63"];
var colors2 = ["#E040FB", "#0018A9", "#1029BA", "#203ACB", "#314BDC", "#425CED", "#536DFE"];

$(function() {

	initialize();

	// ------- engine modal start -------
	$("#engineNew").click(function() {
		if ($("#engineName").attr("modif") == "true") {
			$("#newThing")
				.attr("thing", "engineNew")
				.attr("number", "")
				.html("Создать новые параметры двигателя.");
			$("#newConfirm").modal();
		}
		else
			engineNew();
	});
	$("#engineOpen").click(function() {
		if ($("#engineName").attr("modif") == "true") {
			$("#newThing")
				.attr("thing", "engineLoad")
				.attr("number", "")
				.html("Загрузить параметры двигателя из базы.");
			$("#newConfirm").modal();
		}
		else
			engineLoad();
	});
	$("#engineSave").click(engineSave);
	$("#engineRemove").click(function() {
		if ($("#engineName").attr("engineID") != "") {
			$("#removingThing")
				.text($("#engineName").val())
				.attr("table", "engines")
				.attr("recordID", $("#engineName")
				.attr("engineID"));
			$("#removingConfirm").modal();
		}
	});
	$("#engineLoadApply").click(function() {
	    if (engineLoadApply($("#engineInput").val().split("\n"))) {
	        $("#enginesLoad").modal("hide");
	        $("#engineName").attr("modif", "true");
	    }
        else
            alert("Введены некорректные данные зависимости момента двигателя от оборотов.");
	});
	$(".dropdown-toggle").dropdown();
	// ------- engine modal end -------

	// ------- gear modal start -------
	$(".gearNew").click(function() {
		var gearNumber = $(this).attr("gearNumber");

		if ($(".gearName[gearNumber='" + gearNumber + "']").attr("modif") == "true") {
			$("#newThing")
				.attr("thing", "gearNew")
				.attr("number", gearNumber)
				.html("Создать новые параметры коробки передач.");
			$("#newConfirm").modal();
		}
		else
			gearNew(gearNumber);
	});
	$(".gearOpen").click(function() {
		var gearNumber = $(this).attr("gearNumber");

		if ($(".gearName[gearNumber='" + gearNumber + "']").attr("modif") == "true") {
			$("#newThing")
				.attr("thing", "gearLoad")
				.attr("gearNumber", gearNumber)
				.html("Загрузить параметры коробки передач из базы.");
			$("#newConfirm").modal();
		}
		else
			gearLoad(gearNumber);
	});
	$(".gearSave").click(function() {
		gearSave($(this).attr("gearNumber"));
	});
	$(".gearRemove").click(function() {
		var gearNumber = $(this).attr("gearNumber");

		if ($(".gearName[gearNumber='" + gearNumber + "']").attr("gearID") != "") {
			$("#removingThing")
				.text($(".gearName[gearNumber='" + gearNumber + "']").val())
				.attr("table", "gears")
				.attr("recordID", $(".gearName[gearNumber='" + gearNumber + "']").attr("gearID"))
				.attr("number", gearNumber);
			$("#removingConfirm").modal();
		}
	});
	$("#gearLoadApply").click(function() {
		var gearNumber = $("#gearInput").attr("gearNumber");

		if (gearLoadApply($("#gearInput").val().split("\n"), gearNumber)) {
			$("#gearsLoad").modal("hide");
			$(".gearName[gearNumber='" + gearNumber + "']").attr("modif", "true");
		}
		else
			alert("Введены некорректные данные коробки передач.");
	});
	$(".dropdown-toggle").dropdown();
	// ------- gear modal end -------

	// ------- common modals start -------
	$("#ConfirmRemove").click(removeRecord);
	$("#ConfirmNew").click(function() {
		$("#newConfirm").modal("hide");
		if ($("#newThing").attr("number") == "")
			eval($("#newThing").attr("thing") + "();");
		else
			eval($("#newThing").attr("thing") + "(" + $("#newThing").attr("number") + ");");
	});
	// ------- common modals end -------

	// ------- engine elements start -------
	$("#obFrom").change(function() {
		$("#engineName").attr("modif", "true");
		obFrom = parseFloat($(this).val());
		createObTable();
		refreshResult();
	});
	$("#obTo").change(function() {
		$("#engineName").attr("modif", "true");
		obTo = parseFloat($(this).val());
		createObTable();
		refreshResult();
	});
	$("#obCols").change(function() {
		$("#engineName").attr("modif", "true");
		obCols = $(this).val();
		if (obCols < 4) {
			$(this).val(4);
			obCols = 4;
			alert("Количество известных точек должно быть не меньше четырех!")
		}
		createObTable();
		refreshResult();
	});
	// ------- engine elements end -------

	// ------- gears elements start -------
	$("#gearCols").change(function() {
		$(".gearName[gearNumber='1']").attr("modif", "true");
		gearCols = parseInt($(this).val());
		createGearTable(1);
		refreshResult();
	});
	$("#gearMain").change(function() {
		$(".gearName[gearNumber='1']").attr("modif", "true");
		gearMain = parseFloat($(this).val());
		refreshResult();
	});
	$("#obFinish").change(function() {
		$(".gearName[gearNumber='1']").attr("modif", "true");
		obFinish = parseFloat($(this).val());
		refreshResult();
	});
	
	$("#gearCols2").change(function() {
		$(".gearName[gearNumber='2']").attr("modif", "true");
		gearCols2 = parseInt($(this).val());
		createGearTable(2);
		refreshResult();
	});
	$("#gearMain2").change(function() {
		$(".gearName[gearNumber='2']").attr("modif", "true");
		gearMain2 = parseFloat($(this).val());
		refreshResult();
	});
	$("#obFinish2").change(function() {
		$(".gearName[gearNumber='2']").attr("modif", "true");
		obFinish2 = parseFloat($(this).val());
		refreshResult();
	});
	// ------- gears elements end -------

	// ------- wheels elements start -------
	$("#wheelWidth").change(function() {
		wheelWidth = parseFloat($(this).val());
		refreshResult();
	});
	$("#wheelHeight").change(function() {
		wheelHeight = parseFloat($(this).val());
		refreshResult();
	});
	$("#wheelDisk").change(function() {
		wheelDisk = parseFloat($(this).val());
		//console.log("change wheelDisk");
		refreshResult();
	});
	
	$("#wheelWidth2").change(function() {
		wheelWidth2 = parseFloat($(this).val());
		refreshResult();
	});
	$("#wheelHeight2").change(function() {
		wheelHeight2 = parseFloat($(this).val());
		refreshResult();
	});
	$("#wheelDisk2").change(function() {
		wheelDisk2 = parseFloat($(this).val());
		//console.log("change wheelDisk");
		refreshResult();
	});
	// ------- wheels elements end -------
	
}); // start
//------------------------------------------------------

function initialize() {
	
	interpolStep = 50;
	
	wheelWidth = 185;
	$("#wheelWidth").val(wheelWidth);
	wheelHeight = 70;
	$("#wheelHeight").val(wheelHeight);
	wheelDisk = 14;
	$("#wheelDisk").val(wheelDisk);
	
	wheelWidth2 = 185;
	$("#wheelWidth2").val(wheelWidth2);
	wheelHeight2 = 75;
	$("#wheelHeight2").val(wheelHeight2);
	wheelDisk2 = 14;
	$("#wheelDisk2").val(wheelDisk2);

	getLastEngine();

	getLastGear(1);
	getLastGear(2);
//	gearNumbers = [2.92, 2.05, 1.56, 1.31, 1.13];
//	gearNumbers2 = [2.92, 1.81, 1.28, 0.97, 0.78];
	
	engine = new Engine();
	
	drawWidth = $("#engineDraw").width();
	drawHeight = 600;
	if (SVG.supported) {
		engineDraw = SVG("engineDraw").size("100%", drawHeight);
		gearsDraw = SVG("gearsDraw").size("100%", drawHeight);
		svgExists = true;
	}
	else
	  alert('SVG не поддерживается. Графики рисоваться не будут.');
	
	refreshResult();
	
} // initialize
//------------------------------------------------------

// ------- Engine start -------

function getLastEngine() {

    $.post("engine.php", "command=getLastEngine", function(data) {
        //alert(data);
        var dat = data.split("-=-");

        if (dat[0] == "ok") {
            if ((dat.length > 2) && (dat[3] != "")) {

                $("#engineName")
                	.attr("engineID", dat[1])
                	.attr("modif", "false")
                	.val(dat[2]);

                var d = new Array(2);
                d[0] = dat[3]; // obs
                d[1] = dat[4]; // moms
                engineLoadApply(d);

            }
            else {

				//alert(dat[1]);
                engineNew();

            }
        }
        else
            alert(dat[1]);
    });

} // getLastEngine
//------------------------------------------------------

function engineNew() {

	$("#engineName")
		.val("")
		.attr("engineID", "")
		.attr("modif", "false");
	obFrom = 0;
	$("#obFrom").val(obFrom);
	obTo = 0;
	$("#obTo").val(obTo);
	obCols = 0;
	$("#obCols").val(obCols);

	createObTable();
	refreshResult();

} // engineNew
//------------------------------------------------------

function getengines(id) {

    $.post("engine.php", "command=getEngine&id=" + id, function(data) {
        //alert(data);
        var dat = data.split("-=-");

        if (dat[0] == "ok") {
            if (dat[3] != "") {

                $("#engineName")
                	.attr("engineID", dat[1])
                	.val(dat[2]);

                var d = new Array(2);
                d[0] = dat[3]; // obs
                d[1] = dat[4]; // moms
                engineLoadApply(d);

            }
            else
				alert(dat[1]);
        }
        else
            alert(dat[1]);
    });

} // getengines
//------------------------------------------------------

function engineLoad() {

	fillDropDown("engines");
	$("#engineInput").val("");
	$("#enginesLoad").modal();
	$("#engineName").attr("modif", "false");

} // engineLoad
//------------------------------------------------------

function engineLoadApply(data) {

    var subData;

    if (data.length != 2)
        return false;

    subData = data[0].split("\t");
    obs = new Array(subData.length);
    for (var c = 0; c < obs.length; c++)
        obs[c] = parseInt(subData[c]);

    subData = data[1].split("\t");
    moms = new Array(subData.length);
    for (var c = 0; c < moms.length; c++)
        moms[c] = parseFloat(subData[c]);

    obCols = obs.length;
    $("#obCols").val(obCols);
    obFrom = obs[0];
    $("#obFrom").val(obFrom);
    obTo = obs[obCols - 1];
    $("#obTo").val(obTo);

    createObTable();
    refreshResult();

    return true;

} // engineLoadApply
//------------------------------------------------------

function engineSave() {

    var command = "command=saveEngine&id=" + $("#engineName").attr("engineID") + "&title=" + $("#engineName").val() + "&data=" + obs.join(",") + ";" + moms.join(",");
    //alert("save - " + command);
    $.post("engine.php", command, function(data) {
        //alert(data);
        //console.log(data);
        var dat = data.split("-=-");
        if (dat[0] == "ok") {
            $("#engineName")
            	.attr("engineID", dat[1])
            	.attr("modif", "false");
            alert("Параметры двигателя успешно сохранены");
        }
        else
            alert(dat[1]);
    });

} // engineSave
//------------------------------------------------------

// ------- Engine end -------

// ------- Gears start -------

function getLastGear(gearNumber) {

    $.post("engine.php", "command=getLastGear&number=" + gearNumber, function(data) {
        //alert(data);
        //console.log(data);
        var dat = data.split("-=-");

        if (dat[0] == "ok") {
            if ((dat.length > 2) && (dat[3] != "")) {

                $(".gearName[gearNumber='" + gearNumber + "']")
                	.attr("gearID", dat[1])
                	.attr("modif", "false")
                	.val(dat[2]);

//                var gNumbers = dat[5].split(";");
//				var d = new Array(gNumbers.length + 2);
//
//				d[0] = dat[3]; // obFinish
//				d[1] = dat[4]; // gearMain
//				// gearNumbers
//				for (var c = 0; c < gNumbers.length; c++)
//					d[c+2] = gNumbers[c];

                gearLoadApply(dat[3].split(";"), gearNumber);

            }
            else {

				//alert(dat[1]);
                gearNew();

            }
        }
        else
            alert(dat[1]);
    });

} // getLastGear
//------------------------------------------------------

function gearNew(gearNumber) {

	$(".gearName[gearNumber='" + gearNumber + "']")
		.val("")
		.attr("gearID", "")
		.attr("modif", "false");
	if (gearNumber == "1") {
		gearMain = 0;
		$("#gearMain").val(gearMain);
		gearCols = 0;
		$("#gearCols").val(gearCols);
		obFinish = 0;
		$("#obFinish").val(obFinish);
	}
	else {
		gearMain2 = 0;
    	$("#gearMain2").val(gearMain2);
    	gearCols2 = 0;
    	$("#gearCols2").val(gearCols2);
    	obFinish2 = 0;
    	$("#obFinish2").val(obFinish2);
    }

	createGearTable(gearNumber);
	refreshResult();

} // gearNew
//------------------------------------------------------

function getgears(id, gearNumber) {

    $.post("engine.php", "command=getGear&id=" + id + "&number=" + gearNumber, function(data) {
        alert(data);
        var dat = data.split("-=-");

        if (dat[0] == "ok") {
            if (dat[3] != "") {

                $(".gearName[gearNumber='" + gearNumber + "']")
                	.attr("gearID", dat[1])
                	.val(dat[2]);

//				var gNumbers = dat[5].split(";");
//                var d = new Array(gNumbers.length + 2);
//
//                d[0] = dat[3]; // obFinish
//                d[1] = dat[4]; // gearMain
//                // gearNumbers
//                for (var c = 0; c < gNumbers.length; c++)
//                	d[c+2] = gNumbers[c];

                gearLoadApply(dat[3].split(";"), gearNumber);

            }
            else
				alert(dat[1]);
        }
        else
            alert(dat[1]);
    });

} // getgears
//------------------------------------------------------

function gearLoad(gearNumber) {

	//alert("gearsLoad");
	fillDropDown("gears", gearNumber);
	$("#gearInput")
		.val("")
		.attr("gearNumber", gearNumber);
	$("#gearsLoad").modal();
	$(".gearName[gearNumber='" + gearNumber + "']").attr("modif", "false");

} // gearLoad
//------------------------------------------------------

function gearLoadApply(data, gearNumber) {

    if (data.length < 3)
        return false;
	//console.log("gearNumber=" + gearNumber);
    if (gearNumber == 1) {
		obFinish = parseInt(data[0].replace(",", "."));
    	gearMain = parseFloat(data[1].replace(",", "."));
    	gearCols = parseInt(data.length - 2);
    	gearNumbers = new Array(gearCols);
    	for (var c = 2; c < data.length; c++)
    		gearNumbers[c-2] = parseFloat(data[c].replace(",", "."));
    	$("#gearMain").val(gearMain);
    	$("#gearCols").val(gearCols);
    	$("#obFinish").val(obFinish);
    }
    else {
		obFinish2 = parseInt(data[0].replace(",", "."));
		gearMain2 = parseFloat(data[1].replace(",", "."));
		gearCols2 = parseInt(data.length - 2);
		gearNumbers2 = new Array(gearCols2);
		for (var c = 2; c < data.length; c++)
			gearNumbers2[c-2] = parseFloat(data[c].replace(",", "."));
		$("#gearMain2").val(gearMain2);
		$("#gearCols2").val(gearCols2);
		$("#obFinish2").val(obFinish2);
	 }

    createGearTable(gearNumber);
    refreshResult();

    return true;

} // gearLoadApply
//------------------------------------------------------

function gearSave(gearNumber) {

	var gearID = $(".gearName[gearNumber='" + gearNumber + "']").attr("gearID");
	var gearTitle = $(".gearName[gearNumber='" + gearNumber + "']").val();
	var obFinishCurr = gearNumber == "1" ? obFinish : obFinish2;
	var gearMainCurr = gearNumber == "1" ? gearMain : gearMain2;
	var gearNumbersCurr = gearNumber == "1" ? gearNumbers : gearNumbers2;
    var command = "command=saveGear&id=" + gearID + "&title=" + gearTitle + "&number=" + gearNumber + "&data=" + obFinishCurr + ";" + gearMainCurr + ";" + gearNumbersCurr.join(";");
    //alert("save - " + command);
    $.post("engine.php", command, function(data) {
        //alert(data);
        //console.log(data);
        var dat = data.split("-=-");
        if (dat[0] == "ok") {
            $(".gearName[gearNumber='" + gearNumber + "']")
            	.attr("gearID", dat[1])
            	.attr("modif", "false");
            alert("Параметры коробки передач успешно сохранены");
        }
        else
            alert(dat[1]);
    });

} // gearSave
//------------------------------------------------------

// ------- Gears end -------

// ------- Common DB start -------
function fillDropDown(table, number = -1) {

	var command = "command=getDropDown&table=" + table + "&number=" + number;
	$.post("engine.php", command, function(data) {
		//alert(data);
		var dat = data.split("-=-");

        if (dat[0] == "ok") {
			$("#" + table + "DropDown").html(dat[1]);
			$("." + table + "Load").click(function() {
				var el = $(this);

				$("#" + table + "Load").modal("hide");
				if (el.attr("number"))
					eval("get" + table + "(" + el.attr(table + "ID") + ", " + el.attr("number") + ");");
				else
					eval("get" + table + "(" + el.attr(table + "ID") + ");");
			});
		}
		else
			alert(dat[1]);
	});

} // fillDropDown
//------------------------------------------------------

function removeRecord() {

	$("#removingConfirm").modal("hide");
	$.post("engine.php", "command=removeRecord&table=" + $("#removingThing").attr("table") + "&id=" + $("#removingThing").attr("recordID"), function(data) {
		var dat = data.split("-=-");

		if (dat[0] == "ok") {
			engineNew();
			alert("Запись успешно удалена из базы");
		}
		else
			alert(dat[1]);
	});

} // removeRecord
//------------------------------------------------------

// ------- Common DB end -------

// ------- Common elements start -------

function refreshResult() {

    //console.log("start refresh");
	engine.initialize();
	//console.log("must start moms");
	engine.interpol();
	engine.gearInitialize();
	engine.drawMomentum();
	engine.drawGears();
	
	$("#resTable1").html(engine.findCross());
	$("#resTable2").html(engine.findCross2());
	
} // refreshResult
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

	if ((obCols < 5) || (obTo <= obFrom)) {
		$("#obTable").html("");
		getRank();
		obs.length = 0;
        moms.length = 0;
		return;
	}

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
		body += "<td><input id='mom" + c + "' class='mom' type='number' value='" + moms[c] + "'></td>";
		//console.log(obCurr + " - " + obs[c] + " - " + moms[c]);
		obCurr += obStep;
	}
	
	html += header + "</tr>" + body + "</tr></table>";
	
	$("#obTable").html(html);

	$("input.mom").change(function() {
		$("#engineName").attr("modif", "true");
		refreshResult();
	});
	
} // createObTable
//------------------------------------------------------

function createGearTable(num) {
	
	var html = "<table class='table table-bordered'>";
	var header = "";
	var body = "";
	var gearCurr = 0;
	
	gC = num == 1 ? gearCols : gearCols2;
	gN = num == 1 ? gearNumbers : gearNumbers2;
	col = num == 1 ? colors : colors2;
	idS = num == 1 ? "" : "2";

	if (gC == 0) {
		$("#gearTable").html("");
		gN.length = 0;
		return;
	}

	gN.length = gC;
	
	header = "<tr><th>Передача</th>";
	body = "<tr><td>Передаточное число</td>";
	for (gearCurr = 1; gearCurr <= gC; gearCurr++) {
		header += "<th style='color: #fff; background-color: " + col[gearCurr] + "'>" + gearCurr + "</th>";
		body += "<td><input id='gearNumber" + idS + (gearCurr - 1) + "' class='gearNumber' type='number' value='" + gN[gearCurr - 1] + "'></td>";
	}
	html += header + "</tr>" + body + "</tr></table>";
	
	num == 1 ? $("#gearTable").html(html) : $("#gearTable2").html(html);

	$("input.gearNumber").change(function() {
		$(".gearName[gearNumber='" + num + "']").attr("modif", "true");
		refreshResult();
	});
	
} // createGearTable
//------------------------------------------------------

function getMoms() {
	for (var c = 0; c < obCols; c++) {
		moms[c] = parseFloat($("#mom" + c).val());
		//console.log(moms[c]);
    }
} // getMoms
//------------------------------------------------------

function getGearNumbers() {
	for (var c = 0; c < gearCols; c++)
		gearNumbers[c] = parseFloat($("#gearNumber" + c).val());
	
	for (var c = 0; c < gearCols2; c++)
		gearNumbers2[c] = parseFloat($("#gearNumber2" + c).val());
} // getGearNumbers
//------------------------------------------------------

function clearEngineDraw() {
	
	engineDraw.rect(drawWidth, drawHeight).fill("#ddddff");
	
} // clearEngineDraw
//------------------------------------------------------

function clearGearsDraw() {
	
	gearsDraw.rect(drawWidth, drawHeight).fill("#ddffdd");
	
} // clearGearsDraw
//------------------------------------------------------

// ------- Common elements end -------

// ------- Mathematics start -------

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

function findCrossingGears(gearCols, gears, wheelDiametr, gM, numBox, finishRank) {

	var lastC;
	var sResult = "";
	var oborot;
	var gN = numBox == 1 ? gearNumbers : gearNumbers2;

	// find point between which exists cross
	for (var k = 1; k < gearCols; k++) {
		lastC = 0;
		oborot = -1;
		//console.log("interval #" + (k-1) + " rank=" + rank);
		for (var c = 1; c <= finishRank; c++) {
			if (gears[k].mom[c] == 0.0)
				continue;

			// find crossing interval of ob previous Gears
			lastCC = 0;
			for (var cc = 1; cc <= finishRank; cc++) {
				if (gears[k-1].mom[cc] == 0.0)
					continue;

				//console.log(this.gears[k-1].ob[lastCC] + ", " + this.gears[k-1].ob[cc] + " -=- " + this.gears[k].ob[lastC] + ", " + this.gears[k].ob[c]);

				if (gears[k-1].ob[cc] < gears[k].ob[lastC]) {
					lastCC = cc;
					//console.log("continue before crossing");
					continue;
				}

				crossExists = false;

				if (gears[k-1].ob[lastCC] > gears[k].ob[c]) {
					//console.log("x11=" + this.gears[k-1].ob[lastCC] + "; x21=" + this.gears[k].ob[lastC] + "; x12=" + this.gears[k-1].ob[cc] + "; x22=" + this.gears[k].ob[c]);
					//console.log("max=" + Math.max(this.gears[k-1].ob[lastCC], this.gears[k].ob[lastC]) + "; min=" + Math.min(this.gears[k-1].ob[cc], this.gears[k].ob[c]));
					//console.log("break before crossing");
					break;
				}

				// found this interval
				//crossExists = (this.gears[k-1].mom[lastCC] > this.gears[k].mom[lastC]) != (this.gears[k-1].mom[cc] > this.gears[k].mom[c]);
				crossExists = Math.max(gears[k-1].ob[lastCC], gears[k].ob[lastC]) <= Math.min(gears[k-1].ob[cc], gears[k].ob[c]);
				//console.log("cross result = " + crossExists);
				if (crossExists) {
					//console.log("x11=" + this.gears[k-1].ob[lastCC] + "; x21=" + this.gears[k].ob[lastC] + "; x12=" + this.gears[k-1].ob[cc] + "; x22=" + this.gears[k].ob[c]);
					//console.log("max=" + Math.max(this.gears[k-1].ob[lastCC], this.gears[k].ob[lastC]) + "; min=" + Math.min(this.gears[k-1].ob[cc], this.gears[k].ob[c]));
					//console.log("y11=" + this.gears[k-1].mom[lastCC] + "; y21=" + this.gears[k].mom[lastC] + "; y12=" + this.gears[k-1].mom[cc] + "; y22=" + this.gears[k].mom[c]);
					//console.log("c=" + c);
					//console.log("x13=" + this.gears[k-1].ob[cc+1] + "; x23=" + this.gears[k].ob[c+1]);
					//console.log("y13=" + this.gears[k-1].mom[cc+1] + "; y23=" + this.gears[k].mom[c+1]);
					res = findCrossPoint(
							gears[k-1].ob[lastCC],
							gears[k-1].mom[lastCC],
							gears[k-1].ob[cc],
							gears[k-1].mom[cc],
							gears[k].ob[lastC],
							gears[k].mom[lastC],
							gears[k].ob[c],
							gears[k].mom[c],
							0);
					//console.log(res.x + " -===- " + res.y);
					if (res.x != 0.0) {
						oborot = Math.round(res.x / 60.0 / 3.14 / wheelDiametr * gM * gN[k-1] * 1000.0);
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
			for (var c = 1; c <= finishRank; c++) {
				if (gears[k].mom[cc] == 0.0)
					continue;

				if ((gears[k].ob[lastC] <= gears[k-1].ob[finishRank]) && (gears[k-1].ob[finishRank] <= gears[k].ob[c])) {
					oborot = Math.round(gears[k-1].ob[finishRank] / 60.0 / 3.14 / wheelDiametr * gM * gN[k-1] * 1000.0);
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

} // findCrossingGears
//------------------------------------------------------

function findCrossPoint(x11, y11, x12, y12, x21, y21, x22, y22, method) {

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
//------------------------------------------------------

function fn(x, mx, my) {

	for (var c = 0; c <= rank; c++)
		if (mx[c] == x)
			return my[c];

} // fn
//------------------------------------------------------

// ------- Mathematics end -------

// ------- Objects start -------

function Engine() {
	
	//console.log("start create engine");
	this.gears = [];
	this.gears2 = [];
	this.crossMethod = 0;
	
	this.getWheelDiametr = function(width, height, disk) {
		
		//console.log("start calc calcWheelDiametr");
		return (width * height * 2.0 / 100.0 + 25.4 * disk) / 1000.0;
		
	} // getWheelDiametr
	
	this.createGears = function() {
		
		this.gears = new Array(this.gearCols);
		this.gears2 = new Array(this.gearCols2);
		//console.log("start create gears");
		//console.log("rank=" + rank);
		//console.log(this.gearCols);
		for (var c = 0; c < this.gearCols; c++)
			this.gears[c] = new Gear(c, this, 1);
		
		for (var c = 0; c < this.gearCols2; c++)
			this.gears2[c] = new Gear(c, this, 2);
		
	} // createGears
	
	this.initialize = function() {

		getMoms();
        getGearNumbers();

		this.gearCols = gearNumbers.length;
		this.gearCols2 = gearNumbers2.length;
		this.ob = new Array(rank);
		this.mom = new Array(rank);
		this.wheelDiametr = this.getWheelDiametr(wheelWidth, wheelHeight, wheelDisk);
		this.wheelDiametr2 = this.getWheelDiametr(wheelWidth2, wheelHeight2, wheelDisk2);
		//console.log("Calc. wheelDiametr = " + this.wheelDiametr);
		this.momMax = 0.0;
		this.obGearsMin = -1, this.obGearsMax = -1;
		this.obGearsMin2 = -1, this.obGearsMax2 = -1;
		this.momGearsMin = -1, this.momGearsMax = -1;
		this.momGearsMin2 = -1, this.momGearsMax2 = -1;
		this.finishRank = rank;
		this.finishRank2 = rank;
		var oF = Math.min(obFinish, obTo);
		var oF2 = Math.min(obFinish2, obTo);
		var rankExists = false;
		var rank2Exists = false;
		
		var c = 0;
		obCurr = obs[0];
		obC = obCurr;
		for (k = 0; k <= rank; k++) {
			
			if ((obCurr > oF) && (!rankExists)) {
				this.finishRank = k - 1;
				rankExists = true;
				//console.log("finishRank=" + this.ob[this.finishRank]);
			}
			if ((obCurr > oF2) && (!rank2Exists)) {
				this.finishRank2 = k - 1;
				rank2Exists = true;
				//console.log("finishRank2=" + this.ob[this.finishRank2]);
			}

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
         this.gears[c].initialize(1);
      
      for (var c = 0; c < this.gearCols2; c++)
          this.gears2[c].initialize(2);

   } // gearInitialize
	
	this.drawMomentum = function() {
		var coords = "";
		var x, y;
		var obCurr, momCurr;
		var obStep = parseFloat((obTo - obFrom) / (obCols - 1.0));
		var momStep = parseFloat(this.momMax / (obCols - 1.0));

		var first = true;
		var colorAxe = "#909";
		var colorOther = "#999";
		var color = colorAxe;
		
		if (!svgExists)
			return;
		
		clearEngineDraw();

		if (this.momMax == 0.0)
			return;

		// axes
		obCurr = obFrom;
		first = true;
		for (var c = 0; c < obCols; c++) {
			
			x = roundForInterpol(obCurr);
			x = Math.round((drawWidth - 80) / (obTo - obFrom) * (x - obFrom) + 50);
			engineDraw.text(Math.round(obCurr).toString()).move(x, drawHeight - 90).font({fill: colorAxe, family: "Helvetica", anchor: "middle", stretch: "ultra-condensed"});
			if (first) {
				first = false;
				color = colorAxe;
			}
			else
				color = colorOther;
			engineDraw.line(x, 50, x, drawHeight - 90).fill("none").stroke({color: color, width: 2});
			
			//console.log(x);
			obCurr += obStep;
			
		}
		momCurr = 0;
		first = true;
		for (var c = 0; c <= obCols; c++) {
			
			y = Math.round(drawHeight - 200 - (drawHeight - 200) / this.momMax * momCurr + 100);
			if (y < 50)
				break;
			engineDraw.text(Math.round(momCurr).toString()).move(25, y - 8).font({fill: colorAxe, family: "Helvetica", anchor: "middle"});
			if (first) {
				first = false;
				color = colorAxe;
			}
			else
				color = colorOther;
			engineDraw.line(40, y, drawWidth - 20, y).fill("none").stroke({color: color, width: 2});
			
			momCurr += momStep;
			
		}
		engineDraw.text("Момент, Н*м").move(55, 50).font({fill: colorAxe, family: "Helvetica", anchor: "left", weight: "bold"});
		engineDraw.text("Обороты, об./мин.").move(drawWidth - 150, drawHeight - 120).font({fill: colorAxe, family: "Helvetica", anchor: "left", weight: "bold"});

		// data
		for (var c = 0; c <= rank; c++) {
			if (this.mom[c] == 0.0)
				continue;
			//console.log("engineDraw size - " + $("#engineDraw").width() + " : " + drawHeight);
			//console.log("max of mom - " + this.momMax);
			x = Math.round((drawWidth - 80) / (obTo - obFrom) * (this.ob[c] - obFrom) + 50);
			y = Math.round(drawHeight - 200 - (drawHeight - 200) / this.momMax * this.mom[c] + 100);
			coords += " " + x + " " + y;
			//console.log(coords);
		}
		
		engineDraw.polyline(coords).fill("none").stroke({color: colors[0], width: 1});
		
		// finish
		x = this.ob[this.finishRank];
		y = fn(x, this.ob, this.mom);
		x = Math.round((drawWidth - 80) / (obTo - obFrom) * (x - obFrom) + 50);
		y = Math.round(drawHeight - 200 - (drawHeight - 200) / this.momMax * y + 100);
		engineDraw.line(x, y - 10, x, y + 10).fill("none").stroke({color: colors[1], width: 2});
		x = this.ob[this.finishRank2];
		y = fn(x, this.ob, this.mom);
		x = Math.round((drawWidth - 80) / (obTo - obFrom) * (x - obFrom) + 50);
		y = Math.round(drawHeight - 200 - (drawHeight - 200) / this.momMax * y + 100);
		engineDraw.line(x, y - 10, x, y + 10).fill("none").stroke({color: colors2[1], width: 2});
		
	} // drawMomentum
	
	this.drawGears = function() {
		
		if (!svgExists)
			return;
		
		var obGearsMin = Math.min(this.obGearsMin, this.obGearsMin2);
	    var obGearsMax = Math.max(this.obGearsMax, this.obGearsMax2);
	    var momGearsMin = Math.min(this.momGearsMin, this.momGearsMin2);
	    var momGearsMax = Math.max(this.momGearsMax, this.momGearsMax2);
	    var obCurr, momCurr;
		var obStep = parseFloat((obGearsMax - obGearsMin) / (obCols - 1));
		var momStep = parseFloat((momGearsMax - momGearsMin) / (obCols - 1));

		var first = true;
		var colorAxe = "#909";
		var colorOther = "#999";
		var color = colorAxe;
		
		clearGearsDraw();

		if ((this.momMax == 0.0) || (!momGearsMax) || (momGearsMax == -1))
			return;
		
		//x = Math.round((drawWidth - 70) / (obGearsMax - obGearsMin) * (this.ob[c] - obGearsMin) + 50);
		//y = Math.round(drawHeight - 80 - (drawHeight - 70) / (momGearsMax - momGearsMin) * (this.mom[c] - momGearsMin) + 50);
		
		// axes
		obCurr = obGearsMin;
		first = true;
		for (var c = 0; c < obCols; c++) {
			
			x = Math.round((drawWidth - 70) / (obGearsMax - obGearsMin) * (obCurr - obGearsMin) + 50);
			gearsDraw.text(Math.round(obCurr).toString()).move(x, drawHeight - 25).font({fill: colorAxe, family: "Helvetica", anchor: "middle", stretch: "ultra-condensed"});
			if (first) {
				first = false;
				color = colorAxe;
			}
			else
				color = colorOther;
			gearsDraw.line(x, 20, x, drawHeight - 25).fill("none").stroke({color: color, width: 2});
			
			//console.log(x);
			obCurr += obStep;
			
		}
		momCurr = momGearsMin;
		first = true;
		for (var c = 0; c < obCols; c++) {
			
			y = Math.round(drawHeight - 80 - (drawHeight - 70) / (momGearsMax - momGearsMin) * (momCurr - momGearsMin) + 50);
			if (y < 20)
				break;
			gearsDraw.text(Math.round(momCurr).toString()).move(25, y - 8).font({fill: colorAxe, family: "Helvetica", anchor: "middle"});
			if (first) {
				first = false;
				color = colorAxe;
			}
			else
				color = colorOther;
			gearsDraw.line(44, y, drawWidth - 15, y).fill("none").stroke({color: color, width: 2});
			
			momCurr += momStep;
			
		}
		gearsDraw.text("Момент, Н*м").move(55, 20).font({fill: colorAxe, family: "Helvetica", anchor: "left", weight: "bold"});
		gearsDraw.text("Скорость, км/ч").move(drawWidth - 130, drawHeight - 50).font({fill: colorAxe, family: "Helvetica", anchor: "left", weight: "bold"});
		
		for (var c = 0; c < this.gearCols; c++)
			this.gears[c].drawGear(1);
		
		for (var c = 0; c < this.gearCols2; c++)
			this.gears2[c].drawGear(2);
		
	} // drawGears
	
	this.findCross = function() {
		
		return findCrossingGears(this.gearCols, this.gears, this.wheelDiametr, gearMain, 1, this.finishRank);
		
	} // findCross
	
	this.findCross2 = function() {
		
		return findCrossingGears(this.gearCols2, this.gears2, this.wheelDiametr2, gearMain2, 2, this.finishRank2);
		
	} // findCross2
	
 } // Engine
//------------------------------------------------------

function Gear(num, parent, numBox) {
	
	this.gearNumber = num;
	this.parent = parent;
	
    //console.log("start create gear #" + this.gearNumber + " rank=" + rank);
	
	this.initialize = function(numBox) {
		
		this.ob = new Array(rank);
	    this.mom = new Array(rank);
	    
	    var c, k, obCurr;
	    var gM = numBox == 1 ? gearMain : gearMain2;
	    var gN = numBox == 1 ? gearNumbers : gearNumbers2;
	    var obGearsMin = numBox == 1 ? this.parent.obGearsMin : this.parent.obGearsMin2;
	    var obGearsMax = numBox == 1 ? this.parent.obGearsMax : this.parent.obGearsMax2;
	    var momGearsMin = numBox == 1 ? this.parent.momGearsMin : this.parent.momGearsMin2;
	    var momGearsMax = numBox == 1 ? this.parent.momGearsMax : this.parent.momGearsMax2;
	    var wD = numBox == 1 ? this.parent.wheelDiametr : this.parent.wheelDiametr2;

	    c = 0;
		for (k = 0; k <= rank; k++) {
			
			this.ob[k] = this.parent.ob[k] / gN[this.gearNumber] / gM * 60.0 * 3.14 * wD / 1000.0; // x
			
			if (obGearsMin == -1)
				obGearsMin = this.ob[k];
			else
				if (obGearsMin > this.ob[k])
					obGearsMin = this.ob[k];
			
			if (obGearsMax == -1)
				obGearsMax = this.ob[k];
			else
				if (obGearsMax < this.ob[k])
					obGearsMax = this.ob[k];
			
			if (this.parent.mom[k] == 0.0) {
				this.mom[k] = 0.0;
				continue;
			}
			
			this.mom[k] = this.parent.mom[k] * gN[this.gearNumber] * gM / 4.0 / wD; // y
			
			if (momGearsMin == -1)
				momGearsMin = this.mom[k];
			else
				if (momGearsMin > this.mom[k])
					momGearsMin = this.mom[k];
			
			if (momGearsMax == -1)
				momGearsMax = this.mom[k];
			else
				if (momGearsMax < this.mom[k])
					momGearsMax = this.mom[k];
			
			//console.log("gearNumbers=" + gearNumbers[this.gearNumber] + "; wheelDiametr=" + this.parent.wheelDiametr + "; k=" + k + "; parent.mom=" + this.parent.mom[k] + "; ob[k]=" + this.ob[k] + "; mom[k]=" + this.mom[k]);
			//console.log(this.wheelDiametr + " - " + this.mom[k]);
			if (c == 1)
				this.secondIndex = k;
			c++;
		}
		
		numBox == 1 ? this.parent.obGearsMin = obGearsMin : this.parent.obGearsMin2 = obGearsMin;
	    numBox == 1 ? this.parent.obGearsMax = obGearsMax : this.parent.obGearsMax2 = obGearsMax;
	    numBox == 1 ? this.parent.momGearsMin = momGearsMin : this.parent.momGearsMin2 = momGearsMin;
	    numBox == 1 ? this.parent.momGearsMax = momGearsMax : this.parent.momGearsMax2 = momGearsMax;
		
	} // initialize
	
	this.drawGear = function(numBox) {
		
		var coords = "";
		var x, y;
		
		var col = numBox == 1 ? colors : colors2;
		var obGearsMin = Math.min(this.parent.obGearsMin, this.parent.obGearsMin2);
	    var obGearsMax = Math.max(this.parent.obGearsMax, this.parent.obGearsMax2);
	    var momGearsMin = Math.min(this.parent.momGearsMin, this.parent.momGearsMin2);
	    var momGearsMax = Math.max(this.parent.momGearsMax, this.parent.momGearsMax2);
	    var finishRank = numBox == 1 ? this.parent.finishRank : this.parent.finishRank2;
		
		if (!svgExists)
			return;
		
		// data
		//console.log("start drawing gear #" + this.gearNumber);
		for (var c = 0; c <= finishRank; c++) {
			if (this.mom[c] == 0.0)
				continue;
			//console.log("min=" + this.parent.obGearsMin + "; max=" + this.parent.obGearsMax);
			//console.log("max of mom - " + this.momMax);
			x = Math.round((drawWidth - 70) / (obGearsMax - obGearsMin) * (this.ob[c] - obGearsMin) + 50);
			y = Math.round(drawHeight - 80 - (drawHeight - 70) / (momGearsMax - momGearsMin) * (this.mom[c] - momGearsMin) + 50);
			coords += " " + x + " " + y;
			//console.log(coords);
		}
		
		gearsDraw.polyline(coords).fill("none").stroke({color: col[this.gearNumber+1], width: 1});
		
	} // drawGear

} // Gear
//------------------------------------------------------

// ------- Objects end -------
