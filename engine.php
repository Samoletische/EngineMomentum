<?php
//echo "start";
$res = "";
require("config.php");

if ($res == "") {
	mysqli_query($db, "SET NAMES utf8");
	if (isset($_POST["command"])) {
		switch ($_POST["command"]) {
			case "getLastEngine":
				$res = getLastEngine();
				break;
			case "saveEngine":
				$res = saveEngine($_POST["id"], $_POST["title"], $_POST["data"]);
				break;
			case "getEngine":
				$res = getEngine($_POST["id"]);
            	break;
            case "getLastGear":
				$res = getLastGear($_POST["number"]);
				break;
			case "saveGear":
				$res = saveGear($_POST["id"], $_POST["title"], $_POST["data"], $_POST["number"]);
				break;
			case "getGear":
				$res = getGear($_POST["id"], $_POST["number"]);
				break;
            case "removeRecord":
				$res = removeRecord($_POST["table"], $_POST["id"], $_POST["number"]);
				break;
            case "getDropDown":
            	$res = getDropDown($_POST["table"], $_POST["number"]);
				break;
			default :
				$res = "unknown command";
		}
	}
}

echo $res;
//------------------------------------------------------

// ------- Common DB functions start -------

function getFreeID($table) {

    global $db;

	//throw new Exception("SELECT id FROM ".$table." GROUP BY id ORDER BY id");
    $query = mysqli_query($db, "SELECT id FROM ".$table." GROUP BY id ORDER BY id");
    if (!$query)
    	return 0;

    $id = 1;
    while ($row = mysqli_fetch_array($query)) {
        if ($id != $row["id"])
            break;
        $id++;
    }

    return $id;

} // getFreeID
//------------------------------------------------------

function insertLastParam($field, $param) {

    global $db;

    $query = mysqli_query($db, "SELECT COUNT(id) AS Count FROM lastParams WHERE id=0");
    if (!$query)
        return false;

    if ($row = mysqli_fetch_array($query))
        if ($row["Count"] == 0) {
            $query = mysqli_query($db, "INSERT INTO lastParams(id, ".$field.") VALUES(0, ".$param.")");
            if (!$query)
                return false;
        }
        else {
            $query = mysqli_query($db, "UPDATE lastParams SET ".$field."=".$param." WHERE id=0");
            if (!$query)
                return false;
        }

        return true;

} // insertLastParam
//------------------------------------------------------

// ------- Common DB functions end -------

// ------- Common interface start -------

function getDropDown($table, $number) {

	global $db;
	$html = "";

	try {
		//throw new Exception("SELECT id, title FROM ".$table." GROUP BY id, title");
		$query = mysqli_query($db, "SELECT id, title FROM ".$table." GROUP BY id, title");

		if (!$query)
			throw new Exception("(011) Не могу работать с базой");

		while ($row = mysqli_fetch_array($query))
			if ($number == -1)
				$html .= "<li><a class='".$table."Load' ".$table."ID='".$row["id"]."' href='#'>".$row["title"]."</a></li>";
			else
				$html .= "<li><a class='".$table."Load' ".$table."ID='".$row["id"]."' number='".$number."' href='#'>".$row["title"]."</a></li>";
    }
	catch (Exception $e) {
		return ".-=-".$e;
	}

	return "ok-=-".$html;

} // getDropDown
//------------------------------------------------------

function removeRecord($table, $id, $number) {

	global $db;

	try {
		$query = mysqli_query($db, "DELETE FROM ".$table." WHERE id=".$id);
		if (!$query)
			throw new Exception("(013) Не могу работать с базой");

		if ($number == "") {
			if (!insertLastParam("engineID", 0))
				throw new Exception("(024) Не могу работать с базой");
		}
		else {
			if (!insertLastParam("gearID".$number, 0))
            				throw new Exception("(025) Не могу работать с базой");
		}
	}
	catch (Exception $e) {
		return ".-=-".$e;
	}

	return "ok-=-";

} // removeRecord
//------------------------------------------------------

// ------- Common interface end -------

// ------- Engine interface start -------

function saveEngine($id, $title, $data) {

    global $db;

    try {

        $recordsExists = false;

        if ($id != "") {
            $query = mysqli_query($db, "SELECT COUNT(oborots) AS Count FROM engines WHERE id='".$id."'");
            if (!$query)
                throw new Exception("(002) Не могу работать с базой");

            if ($row = mysqli_fetch_array($query))
                $recordsExists = $row["Count"] != 0;
        }
        else
            $id = getFreeID("engines");

        if ($id == 0)
            throw new Exception("(006) Не могу работать с базой");

        if ($recordsExists) {
            $query = mysqli_query($db, "DELETE FROM engines WHERE id='".$id."'");
            if (!$query)
                throw new Exception("(003) Не могу работать с базой");
        }

        $data = explode(";", $data);
        if (count($data) != 2)
            throw new Exception("(004) Не верные данные для записи в базе");

        $obs = explode(",", $data[0]);
        $moms = explode(",", $data[1]);

        for ($c = 0; $c < count($obs); $c++) {
        	//throw new Exception("INSERT INTO engines(id, title, oborots, momentum, dateSave) VALUES(".$id.", '".$title."', ".$obs[$c].", ".$moms[$c].", '".date("Y-m-d H:i:s")."')");
            $query = mysqli_query($db, "INSERT INTO engines(id, title, oborots, momentum, dateSave) VALUES(".$id.", '".$title."', ".$obs[$c].", ".$moms[$c].", '".date("Y-m-d H:i:s")."')");
            if (!$query)
                throw new Exception("(005) Не могу работать с базой");
        }

        if (!insertLastParam("engineID", $id))
            throw new Exception("(007) Не могу работать с базой");

    }
    catch (Exception $e) {
        return ".-=-".$e;
    }

    return "ok-=-".$id;

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
	$obs = "";
	$moms = "";
	$title = "";

	try {
		//throw new Exception("SELECT title, oborots, momentum FROM engines WHERE id=".$engineID);
		$query = mysqli_query($db, "SELECT title, oborots, momentum FROM engines WHERE id=".$engineID);
		if (!$query)
			throw new Exception("(012) Не могу работать с базой");

		while ($row = mysqli_fetch_array($query)) {
			$obs == "" ? $obs = $row["oborots"] : $obs .= "\t".$row["oborots"];
			$moms == "" ? $moms = $row["momentum"] : $moms .= "\t".$row["momentum"];
			$title = $row["title"];
		}

		if (!insertLastParam("engineID", $engineID))
			throw new Exception("(014) Не могу работать с базой");
	}
	catch (Exception $e) {
		return ".-=-".$e;
	}

	return "ok-=-".$engineID."-=-".$title."-=-".$obs."-=-".$moms;

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