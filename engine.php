<?php
//echo "start";
$res = "";
require("config.php");

if ($res == "") {
	mysqli_query($db, "SET NAMES utf8");
	if (isset($_POST["command"])) {
		switch ($_POST["command"]) {
			case "getEngines":
				$res = getEngines();
				break;
			case "removeRecord":
				$res = removeRecord($_POST["table"], $_POST["id"]);
				break;
      case "getDropDown":
      	$res = getDropDown($_POST["table"]);
				break;
			case "setLastParams":
      	$res = setLastParams($_POST["data"], $_POST["active"]);
				break;
			case "saveEngine":
				$res = saveEngine($_POST["id"], $_POST["title"], $_POST["data"]);
				break;
			case "getEngine":
				$res = getEngine($_POST["id"]);
        break;
      case "saveGear":
				$res = saveGear($_POST["id"], $_POST["title"], $_POST["data"]);
				break;
			case "getGear":
				$res = getGear($_POST["id"]);
				break;
			case "saveWheel":
				$res = saveWheel($_POST["id"], $_POST["title"], $_POST["width"], $_POST["height"], $_POST["disk"]);
				break;
			case "getWheel":
				$res = getWheel($_POST["id"]);
				break;
			default :
				$res = "unknown command";
		}
	}
}

header('Content-type: application/json');
echo json_encode($res);

$db->close();
//------------------------------------------------------

// ------- Common interface start -------
function getEngines() {

	global $db;

	$result = [ "result" => "ok", "sheets" => Array() ];

	try {
		$queryString = "CREATE TEMPORARY TABLE lp
			SELECT
				lastParams.id AS id,
				IFNULL(engines.id, 0) AS engineID,
				IFNULL(engines.title, '') AS engineTitle,
				IFNULL(gears.id, 0) AS gearID,
				IFNULL(gears.title, '') AS gearTitle,
				IFNULL(gears.mainGear, 1) AS mainGear,
				IFNULL(gears.obFinish, 0) AS obFinish,
				IFNULL(wheels.id, 0) AS wheelID,
				IFNULL(wheels.title, '') AS wheelTitle,
				lastParams.active AS active
			FROM
				lastParams
				LEFT JOIN engines ON lastParams.engineID=engines.id
				LEFT JOIN gears ON lastParams.gearID=gears.id
				LEFT JOIN wheels ON lastParams.wheelID=wheels.id
			ORDER BY
				id
			;

			SELECT
				lp.*,
				IFNULL(wh.width, 0) AS wheelWidth,
				IFNULL(wh.height, 0) AS wheelHeight,
				IFNULL(wh.disk, 0) AS wheelDisk
			FROM
				lp
				LEFT JOIN wheels AS wh ON wh.id=lp.WheelID
			;

			SELECT
			 	lp.id AS id,
				moms.engineID AS engineID,
				IFNULL(moms.oborots, 0) AS ob,
				IFNULL(moms.momentum, 0) AS mom
			FROM
				lp
				LEFT JOIN enginesMomentum AS moms ON moms.engineID = lp.engineID
			ORDER BY
				id, engineID, ob
			;

			SELECT
			 	lp.id AS id,
				gs.gearID AS gearID,
				IFNULL(gs.gearNumber, 0) AS num,
				IFNULL(gs.gearValue, 0) AS gear
			FROM
				lp
				LEFT JOIN gearsGears AS gs ON gs.gearID = lp.gearID
			ORDER BY
				id, gearID, num";

		$query = $db->multi_query($queryString);

    if (!$query)
    	throw new Exception("[getAllEngines] error: ".$db->error());

		if (!$db->next_result())
			throw new Exception("[getAllEngines] error: ".$db->error());

		$res = $db->store_result();
		if (!$res)
			throw new Exception("[getAllEngines] error: ".$db->error());

		// sheets
		$active = 0;
		while ($row = $res->fetch_array()) {

			$result["sheets"][] = Array();
			$sheet = count($result["sheets"]) - 1;
			$result["sheets"][$sheet]["engine"] = Array();
			$result["sheets"][$sheet]["engine"]["id"] = $row["engineID"];
			$result["sheets"][$sheet]["engine"]["title"] = $row["engineTitle"];
			$result["sheets"][$sheet]["engine"]["obCols"] = 0;
			$result["sheets"][$sheet]["engine"]["obs"] = "";
			$result["sheets"][$sheet]["engine"]["moms"] = "";

			$result["sheets"][$sheet]["gear"] = Array();
			$result["sheets"][$sheet]["gear"]["id"] = $row["gearID"];
			$result["sheets"][$sheet]["gear"]["title"] = $row["gearTitle"];
			$result["sheets"][$sheet]["gear"]["gearMain"] = $row["mainGear"];
			$result["sheets"][$sheet]["gear"]["obFinish"] = $row["obFinish"];
			$result["sheets"][$sheet]["gear"]["gearCols"] = 0;
			$result["sheets"][$sheet]["gear"]["gears"] = "";

			$result["sheets"][$sheet]["wheel"] = Array();
			$result["sheets"][$sheet]["wheel"]["id"] = $row["wheelID"];
			$result["sheets"][$sheet]["wheel"]["title"] = $row["wheelTitle"];
			$result["sheets"][$sheet]["wheel"]["width"] = $row["wheelWidth"];
			$result["sheets"][$sheet]["wheel"]["height"] = $row["wheelHeight"];
			$result["sheets"][$sheet]["wheel"]["disk"] = $row["wheelDisk"];

			if ($row["active"] == 1)
				$result["active"] = $row["id"];

		}

		if (!$db->next_result())
			throw new Exception("[getAllEngines] error: ".$db->error());

		$res = $db->store_result();
		if (!$res)
			throw new Exception("[getAllEngines] error: ".$db->error());

		// engine
		$obFrom = 0;
    $obTo = 0;
		$lastID = -1;
		$first = true;
		$sheet = 0;
		while ($row = $res->fetch_array()) {

			if ($row["id"] != $lastID) {
				if ($lastID != -1) {
					$result["sheets"][$sheet]["engine"]["obFrom"] = $obFrom;
					$result["sheets"][$sheet]["engine"]["obTo"] = $obTo;
					$result["sheets"][$sheet]["engine"]["obCols"] = $cols;
				}
				$first = true;
				$lastID = $row["id"];
				$sheet = $lastID;
			}

			if ($first) {
				$first = false;
				$obFrom = $row["ob"];
				$result["sheets"][$sheet]["engine"]["obs"] = "";
				$result["sheets"][$sheet]["engine"]["moms"] = "";
				$cols = 0;
			}

			if ($row["ob"] == 0)
				continue;

			$result["sheets"][$sheet]["engine"]["obs"] == "" ? $result["sheets"][$sheet]["engine"]["obs"] = $row["ob"] : $result["sheets"][$sheet]["engine"]["obs"] .= "\t".$row["ob"];
			$result["sheets"][$sheet]["engine"]["moms"] == "" ? $result["sheets"][$sheet]["engine"]["moms"] = $row["mom"] : $result["sheets"][$sheet]["engine"]["moms"] .= "\t".$row["mom"];

			$obTo = $row["ob"];
			$cols++;

		}
		if ($lastID != -1) {
			$result["sheets"][$sheet]["engine"]["obFrom"] = $obFrom;
			$result["sheets"][$sheet]["engine"]["obTo"] = $obTo;
			$result["sheets"][$sheet]["engine"]["obCols"] = $cols;
		}

		if (!$db->next_result())
			throw new Exception("[getAllEngines] error: ".$db->error());

		$res = $db->store_result();
		if (!$res)
			throw new Exception("[getAllEngines] error: ".$db->error());

		// gear
		$lastID = -1;
		$first = true;
		$sheet = 0;
		while ($row = $res->fetch_array()) {

			if ($row["id"] != $lastID) {
				if ($lastID != -1)
					$result["sheets"][$sheet]["gear"]["gearCols"] = $cols;
				$first = true;
				$lastID = $row["id"];
				$sheet = $lastID;
			}

			if ($first) {
				$first = false;
				$result["sheets"][$sheet]["gear"]["gears"] = "";
				$cols = 0;
			}

			if ($row["gear"] == 0)
				continue;

			$result["sheets"][$sheet]["gear"]["gears"] == "" ? $result["sheets"][$sheet]["gear"]["gears"] = $row["gear"] : $result["sheets"][$sheet]["gear"]["gears"] .= ";".$row["gear"];

			$cols++;

		}
		if ($lastID != -1)
			$result["sheets"][$sheet]["gear"]["gearCols"] = $cols;

	}
	catch (Exception $e) {
		$result["result"] = "error";
		$result["message"] = $e->getMessage();
	}

	return $result;

} // getAllEngines
//------------------------------------------------------

function getDropDown($table) {

	global $db;

	$result = [ "result" => "ok", "dropdown" => "" ];

	$query = $db->query("SELECT id, title FROM ".$table);

	if (!$query) {
		$result["result"] = "error";
		$result["message"] = "[saveEngine] error: ".$db->error();
		return $result;
	}

	while ($row = $query->fetch_array())
		$result["dropdown"] .= "<li><a class='".$table."Load' ".$table."ID='".$row["id"]."' href='#'>".$row["title"]."</a></li>";

	return $result;

} // getDropDown
//------------------------------------------------------

function removeRecord($table, $id) {

	global $db;

	$result = [ "result" => "ok" ];

	$queryStr = "DELETE FROM ".$table." WHERE id='".$id."';";
	if ($table == "engines") {
		$queryStr .= "DELETE FROM enginesMomentum WHERE engineID='".$id."';
			UPDATE lastParams SET engineID=0 WHERE active=1";
	}
	if ($table == "gears") {
		$queryStr .= "DELETE FROM gearsGears WHERE gearID='".$id."';
			UPDATE lastParams SET gearID=0 WHERE active=1";
	}
	else
		$queryStr .= "UPDATE lastParams SET wheelID=0 WHERE active=1";

	$query = $db->multi_query($queryStr);
	if (!$query) {
		$result["result"] = "error";
		$result["message"] = "[removeRecord] error: ".$db->error();
		return $result;
	}

	return $result;

} // removeRecord
//------------------------------------------------------

function setLastParams($data, $id) {

	global $db;

	$result = [ "result" => "ok" ];

	$queryStr = "";

	if ($data != "") {
		$queryStr .= "DELETE FROM lastParams;";
		$rows = explode(";", $data);
		for ($c = 0; $c < count($rows); $c++) {
			$ids = explode(",", $rows[$c]);
			 $queryStr .= "INSERT INTO lastParams(id, engineID, gearID, wheelID, active)
			 	VALUES('".$c."', '".$ids[0]."', '".$ids[1]."', '".$ids[2]."', 0);";
		}
	}

	$queryStr .= "UPDATE lastParams SET active=0 WHERE id<>'".$id."';
		UPDATE lastParams SET active=1 WHERE id='".$id."'";

	$query = $db->multi_query($queryStr);

	if(!$query) {
		$result["result"] = "error";
		$result["message"] = "[setLastParams] error: ".$db->error();
		return $result;
	}

	return $result;

}
//------------------------------------------------------
// ------- Common interface end -------

// ------- Engine interface start -------
function saveEngine($id, $title, $data) {

	global $db;

	$result = [ "result" => "ok" ];

  $existsMain = false;
	$existsData = false;


  if ($id != "") {
  	$query = $db->query("SELECT
				COUNT(engines.id) AS CountMain,
				COUNT(enginesMomentum.oborots) AS CountData
			FROM
				engines
				LEFT JOIN	enginesMomentum ON engines.id=enginesMomentum.engineID
			WHERE engines.id='".$id."'");
    if (!$query) {
			$result["result"] = "error";
			$result["message"] = "[saveEngine] error: ".$db->error();
			return $result;
		}

    if ($row = $query->fetch_array()) {
      $existsMain = $row["CountMain"] != 0;
			$existsData = $row["CountData"] != 0;
		}
  }
  else
    $id = getFreeID("engines");

  if ($id == 0) {
		$result["result"] = "error";
		$result["message"] = "[saveEngine] error: no free id in table 'engines'";
		return $result;
	}

	$date = date("Y-m-d H:i:s");
  if ($existsMain)
		$queryStr = "UPDATE engines SET title='".$title."', changeDate='".$date."' WHERE id='".$id."';";
	else
		$queryStr = "INSERT INTO engines(id, title, changeDate)
			VALUES('".$id."', '".$title."', '".$date."');";

	if ($existsData)
		$queryStr .= "DELETE FROM enginesMomentum WHERE engineID='".$id."';";

  $data = explode(";", $data);
  if (count($data) != 2) {
  	$result["result"] = "error";
		$result["message"] = "[saveEngine] error: not enough data for save engine";
		return $result;
	}

  $obs = explode(",", $data[0]);
  $moms = explode(",", $data[1]);

  for ($c = 0; $c < count($obs); $c++)
		$queryStr .= "INSERT INTO enginesMomentum(engineID, oborots, momentum, changeDate)
			VALUES('".$id."', '".$obs[$c]."', '".$moms[$c]."', '".$date."');";

	$queryStr .= "UPDATE lastParams SET engineID='".$id."' WHERE active=1";
	// $result["message"] = $queryStr;
	$query = $db->multi_query($queryStr);
	if (!$query) {
		$result["result"] = "error";
		$result["message"] = "[saveEngine] error: ".$db->error();
		return $result;
	}

  $result["id"] = $id;

	return $result;

} // saveEngine
//------------------------------------------------------

function getEngine($engineID) {

	global $db;

	$result = [ "result" => "ok", "title" => "", "obFrom" => 100000, "obTo" => 0, "obs" => "", "moms" => "" ];

	$query = $db->multi_query("SELECT
			engines.title,
			IFNULL(enginesMomentum.oborots, 0) AS oborots,
			IFNULL(enginesMomentum.momentum, 0) AS momentum
		FROM
			engines
			LEFT JOIN enginesMomentum ON engines.id=enginesMomentum.engineID
		WHERE
			engines.id='".$engineID."'
		;

		UPDATE lastParams SET engineID='".$engineID."' WHERE active=1");
	if (!$query) {
		$result["result"] = "error";
		$result["message"] = "[loadEngine] error: ".$db->error();
		return $result;
	}

	$res = $db->store_result();
	if (!$res) {
		$result["result"] = "error";
		$result["message"] = "[loadEngine] error: ".$db->error();
		return $result;
	}

	$first = true;
	while ($row = $res->fetch_array()) {
		if ($first) {
			$first = false;
			$result["title"] = $row["title"];
		}
		if ($row["oborots"] == 0)
			continue;

		$result["obFrom"] = min($result["obFrom"], $row["oborots"]);
		$result["obTo"] = max($result["obTo"], $row["oborots"]);

		$result["obs"] == "" ? $result["obs"] = $row["oborots"] : $result["obs"] .= "\t".$row["oborots"];
		$result["moms"] == "" ? $result["moms"] = $row["momentum"] : $result["moms"] .= "\t".$row["momentum"];
	}

	return $result;

} // getEngine
//------------------------------------------------------
// ------- Engine interface end -------

// ------- Gear interface start -------
function saveGear($id, $title, $data) {

  global $db;

	$result = [ "result" => "ok" ];

  $existsMain = false;
	$existsData = false;

  if ($id != "") {
  	$query = $db->query("SELECT
				COUNT(gears.id) AS CountMain,
				COUNT(gearsGears.gearValue) AS CountData
			FROM
				gears
				LEFT JOIN gearsGears ON gears.id=gearsGears.gearID
			WHERE gears.id='".$id."'");
    if (!$query) {
			$result["result"] = "error";
			$result["message"] = "[saveGear] error: ".$db->error();
			return $result;
		}

    if ($row = $query->fetch_array()) {
      $existsMain = $row["CountMain"] != 0;
			$existsData = $row["CountData"] != 0;
		}
  }
  else
    $id = getFreeID("gears");

	if ($id == 0) {
		$result["result"] = "error";
		$result["message"] = "[saveGear] error: no free id in table 'gears'";
		return $result;
	}

	$data = explode(";", $data);
	if (count($data) < 3) {
		$result["result"] = "error";
		$result["message"] = "[saveGear] error: not enough data for save gear";
		return $result;
	}

	$date = date("Y-m-d H:i:s");
  if ($existsMain)
		$queryStr = "UPDATE gears SET title='".$title."', mainGear='".$data[0]."', obFinish='".$data[1]."', changeDate='".$date."' WHERE id='".$id."';";
	else
		$queryStr = "INSERT INTO gears(id, title, mainGear, obFinish, changeDate)
			VALUES('".$id."', '".$title."', '".$data[0]."', '".$data[1]."', '".$date."');";

	if ($existsData)
		$queryStr .= "DELETE FROM gearsGears WHERE gearID='".$id."';";

  for ($c = 2; $c < count($data); $c++)
		$queryStr .= "INSERT INTO gearsGears(gearID, gearNumber, gearValue)
			VALUES('".$id."', '".($c - 1)."', '".$data[$c]."');";

	$queryStr .= "UPDATE lastParams SET gearID='".$id."' WHERE active=1";

	$query = $db->multi_query($queryStr);
	if (!$query) {
		$result["result"] = "error";
		$result["message"] = "[saveGear] error: ".$db->error();
		return $result;
	}

  $result["id"] = $id;

	return $result;

} // saveGear
//------------------------------------------------------

function getGear($gearID) {

	global $db;

	$result = [ "result" => "ok", "title" => "", "mainGear" => 0, "obFinish" => 0, "gears" => "" ];

	$queryStr = "SELECT
			gears.title,
			gears.mainGear,
			gears.obFinish,
			IFNULL(gearsGears.gearValue, 0) AS gearValue
		FROM
			gears
			LEFT JOIN gearsGears ON gears.id=gearsGears.gearID
		WHERE
			gears.id='".$gearID."'
		ORDER BY
			gearsGears.gearNumber
		;

		UPDATE lastParams SET gearID='".$gearID."' WHERE active=1";
	$query = $db->multi_query($queryStr);
	if (!$query) {
		$result["result"] = "error";
		$result["message"] = "[loadGear] error: ".$db->error();
		return $result;
	}

	$res = $db->store_result();
	if (!$res) {
		$result["result"] = "error";
		$result["message"] = "[loadGear] error: ".$db->error();
		return $result;
	}

	$first = true;
	while ($row = $res->fetch_array()) {
		if ($first) {
			$result["title"] = $row["title"];
			$result["mainGear"] = $row["mainGear"];
			$result["obFinish"] = $row["obFinish"];
		}
		if ($row["gearValue"] == 0)
			continue;
		$result["gears"] == "" ? $result["gears"] = $row["gearValue"] : $result["gears"] .= ";".$row["gearValue"];
	}

	return $result;

} // getGear
//------------------------------------------------------
// ------- Gear interface end -------

// ------- Wheel interface start -------
function saveWheel($id, $title, $width, $height, $disk) {

  global $db;

	$result = [ "result" => "ok" ];

	$recordsExists = false;

  if ($id != "") {
  	$query = $db->query("SELECT
				COUNT(id) AS Count
			FROM
				wheels
			WHERE id='".$id."'");
    if (!$query) {
			$result["result"] = "error";
			$result["message"] = "[saveWheel] error: ".$db->error();
			return $result;
		}

    if ($row = $query->fetch_array())
      $recordsExists = $row["Count"] != 0;
  }
  else
    $id = getFreeID("wheels");

	if ($id == 0) {
		$result["result"] = "error";
		$result["message"] = "[saveWheel] error: no free id in table 'wheels'";
		return $result;
	}

	$date = date("Y-m-d H:i:s");
  if ($recordsExists)
		$queryStr = "UPDATE wheels SET title='".$title."', width='".$width."', height='".$height."', disk='".$disk."', changeDate='".$date."' WHERE id='".$id."';";
	else
		$queryStr = "INSERT INTO wheels(id, title, width, height, disk, changeDate)
			VALUES('".$id."', '".$title."', '".$width."', '".$height."', '".$disk."', '".$date."');";

  $queryStr .= "UPDATE lastParams SET wheelID='".$id."' WHERE active=1";

	$query = $db->multi_query($queryStr);
	if (!$query) {
		$result["result"] = "error";
		$result["message"] = "[saveWheel] error: ".$db->error();
		return $result;
	}

  $result["id"] = $id;

	return $result;

} // saveWheel
//------------------------------------------------------

function getWheel($wheelID) {

	global $db;

	$result = [ "result" => "ok", "title" => "", "width" => 0, "height" => 0, "disk" => "" ];

	$queryStr = "SELECT title, width, height, disk FROM wheels WHERE id='".$wheelID."';
		UPDATE lastParams SET wheelID='".$wheelID."' WHERE active=1";
	$query = $db->multi_query($queryStr);
	if (!$query) {
		$result["result"] = "error";
		$result["message"] = "[loadWheel] error: ".$db->error();
		return $result;
	}

	$res = $db->store_result();
	if (!$res) {
		$result["result"] = "error";
		$result["message"] = "[loadWheel] error: ".$db->error();
		return $result;
	}

	if ($row = $res->fetch_array()) {
		$result["title"] = $row["title"];
		$result["width"] = $row["width"];
		$result["height"] = $row["height"];
		$result["disk"] = $row["disk"];
	}

	return $result;

} // getWheel
//------------------------------------------------------
// ------- Wheel interface end -------
?>
