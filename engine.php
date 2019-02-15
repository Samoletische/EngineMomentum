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
			// case "getLastEngine":
			// 	$res = getLastEngine();
			// 	break;
			case "saveEngine":
				$res = saveEngine($_POST["id"], $_POST["title"], $_POST["data"]);
				break;
			case "getEngine":
				$res = getEngine($_POST["id"]);
        break;
      // case "getLastGear":
			// 	$res = getLastGear($_POST["number"]);
			// 	break;
			case "saveGear":
				$res = saveGear($_POST["id"], $_POST["title"], $_POST["data"], $_POST["number"]);
				break;
			case "getGear":
				$res = getGear($_POST["id"], $_POST["number"]);
				break;
      case "removeRecord":
				$res = removeRecord($_POST["table"], $_POST["id"]);
				break;
      case "getDropDown":
      	$res = getDropDown($_POST["table"]);
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

	$result = [ "result" => "ok" ];
	$result["sheets"] = Array();

	try {
		$queryString = "CREATE TEMPORARY TABLE lp
			SELECT
				lastParams.id AS id,
				engines.id AS engineID,
				engines.title AS engineTitle,
				gears.id AS gearID,
				gears.title AS gearTitle,
				gears.mainGear AS mainGear,
				gears.obFinish AS obFinish,
				wheels.id AS wheelID,
				wheels.title AS wheelTitle,
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
				wh.width AS wheelWidth,
				wh.height AS wheelHeight,
				wh.disk AS wheelDisk
			FROM
				lp
				LEFT JOIN wheels AS wh ON wh.id=lp.WheelID
			;

			SELECT
			 	lp.id AS id,
				moms.engineID AS engineID,
				moms.oborots AS ob,
				moms.momentum AS mom
			FROM
				lp
				INNER JOIN enginesMomentum AS moms ON moms.engineID = lp.engineID
			ORDER BY
				id, engineID, ob
			;

			SELECT
			 	lp.id AS id,
				gs.gearID AS gearID,
				gs.gearNumber AS num,
				gs.gearValue AS gear
			FROM
				lp
				INNER JOIN gearsGears AS gs ON gs.gearID = lp.gearID
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

			$result["sheets"][$sheet]["gear"] = Array();
			$result["sheets"][$sheet]["gear"]["id"] = $row["gearID"];
			$result["sheets"][$sheet]["gear"]["title"] = $row["gearTitle"];
			$result["sheets"][$sheet]["gear"]["gearMain"] = $row["mainGear"];
			$result["sheets"][$sheet]["gear"]["obFinish"] = $row["obFinish"];

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

// ------- Common interface end -------

// ------- Engine interface start -------

function saveEngine($id, $title, $data) {

	global $db;

	$result = [ "result" => "ok" ];

  $recordsExists = false;

  if ($id != "") {
  	$query = $db->query("SELECT COUNT(oborots) AS Count FROM enginesMomentum WHERE engineID='".$id."'");
    if (!$query) {
			$result["result"] = "error";
			$result["message"] = "[saveEngine] error: ".$db->error();
			return $result;
		}

    if ($row = $query->fetch_array())
      $recordsExists = $row["Count"] != 0;
  }
  else
    $id = getFreeID("engines");

  if ($id == 0) {
		$result["result"] = "error";
		$result["message"] = "[saveEngine] error: no free id in table 'engines'";
		return $result;
	}

	$date = date("Y-m-d H:i:s");
  if ($recordsExists)
		$queryStr = "UPDATE engines SET title='".$title."', changeDate='".$date."' WHERE id='".$id."';
			DELETE FROM enginesMomentum WHERE engineID='".$id."';";
	else
		$queryStr = "INSERT INTO engines(id, title, changeDate)
			VALUES('".$id."', '".$title."', '".$date."');";

  $data = explode(";", $data);
  if (count($data) != 2)
    throw new Exception("[saveEngine] error: ".$db->error());

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

function getLastEngine() {

    global $db;
    $engineID = 0;
    $result = "";

    try {
        $query = mysqli_query($db, "SELECT engineID FROM lastParams WHERE id=0");
        if (!$query)
            throw new Exception("(008) Не могу работать с базой");

        if ($row = mysqli_fetch_array($query))
            $engineID = $row["engineID"];

        if ($engineID < 1)
            //throw new Exception("(009) Не найдены данные в базе");
            return "ok-=-";

        $result = getEngine($engineID);
        if (substr($result, 0, 1) == ".")
        	throw new Exception(substr($result, 4));

        $result = substr($result, 5);
    }
    catch (Exception $e) {
        return ".-=-".$e;
    }

    return "ok-=-".$result;

} // getLastEngine
//------------------------------------------------------

function getEngine($engineID) {

	global $db;

	$result = [ "result" => "ok", "title" => "", "obFrom" => 100000, "obTo" => 0, "obs" => "", "moms" => "" ];

	$query = $db->multi_query("SELECT
			engines.title,
			enginesMomentum.oborots,
			enginesMomentum.momentum
		FROM
			engines
			INNER JOIN enginesMomentum ON engines.id=enginesMomentum.engineID
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
		$result["obFrom"] = min($result["obFrom"], $row["oborots"]);
		$result["obTo"] = max($result["obTo"], $row["oborots"]);

		$result["obs"] == "" ? $result["obs"] = $row["oborots"] : $result["obs"] .= "\t".$row["oborots"];
		$result["moms"] == "" ? $result["moms"] = $row["momentum"] : $result["moms"] .= "\t".$row["momentum"];
		if ($first) {
			$first = false;
			$result["title"] = $row["title"];
		}
	}

	return $result;

} // getEngine
//------------------------------------------------------

// ------- Engine interface end -------

// ------- Gear interface start -------

function saveGear($id, $title, $data, $number) {

    global $db;

    try {

        $recordsExists = false;

        if ($id != "") {
            $query = mysqli_query($db, "SELECT COUNT(value) AS Count FROM gears WHERE id='".$id."'");
            if (!$query)
                throw new Exception("(015) Не могу работать с базой");

            if ($row = mysqli_fetch_array($query))
                $recordsExists = $row["Count"] != 0;
        }
        else
            $id = getFreeID("gears");

        if ($id == 0)
            throw new Exception("(016) Не могу работать с базой");

        if ($recordsExists) {
            $query = mysqli_query($db, "DELETE FROM gears WHERE id='".$id."'");
            if (!$query)
                throw new Exception("(017) Не могу работать с базой");
        }

        $data = explode(";", $data);
        if (count($data) < 3)
            throw new Exception("(018) Не верные данные для записи в базе");

        for ($c = 0; $c < count($data); $c++) {
        	$type = $c < 2 ? $c : 2;
        	//throw new Exception("INSERT INTO gears(id, title, value, type, dateSave) VALUES(".$id.", '".$title."', ".$data[$c].", ".$type.", '".date("Y-m-d H:i:s")."')");
        	$query = mysqli_query($db, "INSERT INTO gears(id, title, value, type, dateSave) VALUES(".$id.", '".$title."', ".$data[$c].", ".$type.", '".date("Y-m-d H:i:s")."')");
            if (!$query)
                throw new Exception("(019) Не могу работать с базой");
        }

        if (!insertLastParam("gearID".$number, $id))
            throw new Exception("(020) Не могу работать с базой");

    }
    catch (Exception $e) {
        return ".-=-".$e;
    }

    return "ok-=-".$id;

} // saveGear
//------------------------------------------------------

function getLastGear($number) {

    global $db;
    $gearID = 0;
    $result = "";

    try {
    	//throw new Exception("SELECT gearID".$number." AS gearID FROM lastParams WHERE id=0");
        $query = mysqli_query($db, "SELECT gearID".$number." AS gearID FROM lastParams WHERE id=0");
        if (!$query)
            throw new Exception("(021) Не могу работать с базой");

        if ($row = mysqli_fetch_array($query))
            $gearID = $row["gearID"];

		if ($gearID < 1)
            return "ok-=-";

        $result = getGear($gearID, $number);
        if (substr($result, 0, 1) == ".")
        	throw new Exception(substr($result, 4));

        $result = substr($result, 5);
    }
    catch (Exception $e) {
        return ".-=-".$e;
    }

    return "ok-=-".$result;

} // getLastGear
//------------------------------------------------------

function getGear($gearID, $number) {

	global $db;
	$title = "";
	$data = "";

	try {
		$query = mysqli_query($db, "SELECT title, value FROM gears WHERE id=".$gearID." ORDER BY type");
		if (!$query)
			throw new Exception("(022) Не могу работать с базой");

		while ($row = mysqli_fetch_array($query)) {
			$data == "" ? $data = $row["value"] : $data .= ";".$row["value"];
			$title = $row["title"];
		}

		if (!insertLastParam("gearID".$number, $gearID))
			throw new Exception("(023) Не могу работать с базой");
	}
	catch (Exception $e) {
		return ".-=-".$e;
	}

	return "ok-=-".$gearID."-=-".$title."-=-".$data;

} // getGear
//------------------------------------------------------

// ------- Gear interface end -------
?>
