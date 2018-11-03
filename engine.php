<?php
//echo "start";
$res = "";
$db = mysqli_connect("localhost", "root", "5ql@dmin", "engine");
if (!$db)
	$res = ".-=-(001) Не могу подключиться к базе данных по причине: ".mysqli_connect_error();

if ($res == "") {
	mysqli_query($db, "SET NAMES utf8");
	if (isset($_POST["command"])) {
		switch ($_POST["command"]) {
			case "saveEngine":
				$res = saveEngine($_POST["id"], $_POST["title"], $_POST["data"]);
				break;
			case "removeRecord":
				$res = removeRecord($_POST["table"], $_POST["id"]);
				break;
			case "getLastEngine":
				$res = getLastEngine();
				break;
			case "getEngine":
				$res = getEngine($_POST["id"]);
            	break;
            case "getDropDown":
            	$res = getDropDown($_POST["table"]);
				break;
			default :
				$res = "unknown command";
		}
	}
}

echo $res;
//------------------------------------------------------

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

}
//------------------------------------------------------

function getFreeID($table) {

    global $db;

    $query = mysqli_query($db, "SELECT id FROM ".$table." GROUP BY id ORDER BY id");
    if (!$query) {
    	$err = mysql_error();
    	return 0;
    }

    $id = 1;
    while ($row = mysqli_fetch_array($query)) {
        if ($id != $row["id"])
            break;
        $id++;
    }

    return $id;

}
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

}
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

}
//------------------------------------------------------

function getDropDown($table) {

	global $db;
	$html = "";

	try {
		//throw new Exception("SELECT id, title FROM ".$table." GROUP BY id, title");
		$query = mysqli_query($db, "SELECT id, title FROM ".$table." GROUP BY id, title");

		if (!$query)
			throw new Exception("(011) Не могу работать с базой");

		while ($row = mysqli_fetch_array($query))
			$html .= "<li><a class='".$table."Load' ".$table."ID='".$row["id"]."' href='#'>".$row["title"]."</a></li>";
    }
	catch (Exception $e) {
		return ".-=-".$e;
	}

	return "ok-=-".$html;

}
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

}
//------------------------------------------------------

function removeRecord($table, $id) {

	global $db;

	try {
		$query = mysqli_query($db, "DELETE FROM ".$table." WHERE id=".$id);
		if (!$query)
			throw new Exception("(013) Не могу работать с базой");

		if (!insertLastParam("engineID", 0))
			throw new Exception("(014) Не могу работать с базой");
	}
	catch (Exception $e) {
		return ".-=-".$e;
	}

	return "ok-=-";

}
//------------------------------------------------------
?>